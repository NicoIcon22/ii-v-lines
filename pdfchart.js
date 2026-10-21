/* Chart PDFs: read chord symbols and a title from a lead-sheet PDF, and draw its pages.
 *
 * pdf.js is loaded the first time a PDF is used. Chord symbols are found in the PDF's text
 * layer: text pieces on the same line are joined (so "F" followed by a raised "-7" becomes
 * "F-7"), and a line is kept only when most of its words look like chord symbols, which
 * drops titles, lyrics and copyright lines. Scanned charts have no text layer, so nothing
 * is read from them; they are still shown.
 */
(function(){
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
let loading = null;
function lib(){
  if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if(!loading) loading = new Promise((res, rej)=>{
    const s = document.createElement("script");
    s.src = PDFJS;
    s.onload = ()=>{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER; res(window.pdfjsLib); };
    s.onerror = ()=>{ loading = null; rej(new Error("Couldn't load the PDF reader. Check your connection and try again.")); };
    document.head.appendChild(s);
  });
  return loading;
}
async function open(blob){
  const pdfjs = await lib();
  const data = new Uint8Array(await blob.arrayBuffer());
  return pdfjs.getDocument({data}).promise;
}

/* ---------- chord symbols ---------- */
const ACC = "(?:b|#|♭|♯)";
const CHORD = new RegExp("^[A-G]" + ACC + "?(?:maj|ma|min|mi|m|M|dim|aug|sus|alt|add|[-+°øØoΔ∆^]|[0-9]|[()]|" + ACC + "|,)*(?:/[A-G]" + ACC + "?)?$");
function cleanToken(t){
  return t.replace(/[−–]/g,"-").replace(/[△Δ∆^]/g,"maj").replace(/Ø/g,"ø")
    .replace(/^[|:\[\]{}]+|[|:\[\]{}.]+$/g,"");
}
const isChord = t => CHORD.test(t);

/* group text items into lines (top to bottom), joining pieces that touch */
function linesOf(items){
  const its = items.filter(i=>i.str && i.str.trim()).map(i=>{
    const t = i.transform, size = Math.hypot(t[2], t[3]) || i.height || 10;
    return {s:i.str, x:t[4], y:t[5], w:i.width || 0, size};
  }).sort((a,b)=> b.y-a.y || a.x-b.x);
  const lines = [];
  its.forEach(it=>{
    const ln = lines.find(l => Math.abs(l.y - it.y) < Math.max(l.size, it.size)*0.7);
    if(ln){ ln.items.push(it); ln.size = Math.max(ln.size, it.size); }
    else lines.push({y:it.y, size:it.size, items:[it]});
  });
  lines.sort((a,b)=> b.y-a.y);
  return lines.map(l=>{
    l.items.sort((a,b)=> a.x-b.x);
    let s = "", end = null;
    l.items.forEach(it=>{
      if(end!==null) s += (it.x - end > it.size*0.25) ? " " : "";
      s += it.s; end = it.x + it.w;
    });
    return {text:s, size:l.size, y:l.y};
  });
}

async function read(blob, filename){
  const doc = await open(blob);
  const rows = []; let count = 0, titleGuess = "";
  for(let p=1; p<=doc.numPages; p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const lines = linesOf(tc.items);
    if(p===1){
      /* the biggest text in the top third of page 1 is usually the title */
      const vp = page.getViewport({scale:1});
      const top = lines.filter(l=> l.y > vp.height*0.66 && /[a-z]{2}/i.test(l.text));
      const big = top.sort((a,b)=> b.size-a.size)[0];
      if(big && !big.text.split(/\s+/).every(w=>isChord(cleanToken(w)))) titleGuess = big.text.trim();
    }
    lines.forEach(l=>{
      const words = l.text.split(/\s+/).map(cleanToken).filter(Boolean);
      if(!words.length) return;
      const chords = words.filter(isChord);
      if(chords.length && chords.length >= words.length*0.5){ rows.push(chords.join(" ")); count += chords.length; }
    });
  }
  let meta = "";
  try{ const m = await doc.getMetadata(); meta = (m && m.info && m.info.Title || "").trim(); }catch(e){}
  if(meta && !/untitled|\.pdf$|^microsoft|^document/i.test(meta)) titleGuess = meta;
  if(!titleGuess && filename) titleGuess = filename.replace(/\.pdf$/i,"").replace(/[_]+/g," ").replace(/\s+-\s+.*$/,"").trim();
  titleGuess = titleGuess.replace(/\s{2,}/g," ").slice(0,80);
  const pages = doc.numPages;
  doc.destroy();
  return {changes: rows.join("\n"), count, title: titleGuess, pages};
}

/* draw every page into `box`, sized to its width */
let drawToken = 0;
async function draw(blob, box){
  const token = ++drawToken;
  box.innerHTML = "";
  const doc = await open(blob);
  const width = Math.max(280, box.clientWidth || 800), dpr = Math.min(window.devicePixelRatio || 1, 2);
  for(let p=1; p<=doc.numPages; p++){
    if(token!==drawToken) break;
    const page = await doc.getPage(p);
    const base = page.getViewport({scale:1});
    const vp = page.getViewport({scale: width/base.width * dpr});
    const c = document.createElement("canvas");
    c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    c.style.width = "100%"; c.setAttribute("role","img"); c.setAttribute("aria-label", `Chart page ${p}`);
    box.appendChild(c);
    await page.render({canvasContext:c.getContext("2d"), viewport:vp}).promise;
  }
  doc.destroy();
}

window.PDFCHART = {read, draw, isChord};
})();
