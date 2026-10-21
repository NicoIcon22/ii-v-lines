/* Chart PDFs: read chord symbols and a title from a lead-sheet PDF, and draw its pages.
 *
 * pdf.js is loaded the first time a PDF is used. Chord symbols are found in the PDF's text
 * layer: text pieces on the same line are joined (so "F" followed by a raised "-7" becomes
 * "F-7"), and a line is kept only when most of its words look like chord symbols, which
 * drops titles, lyrics and copyright lines. Scanned charts have no text layer: their pages
 * are drawn and read with OCR (Tesseract.js, loaded only then), and the same filter picks
 * the chord lines out of what OCR finds.
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
const TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
let tessLoading = null;
function tess(){
  if(window.Tesseract) return Promise.resolve(window.Tesseract);
  if(!tessLoading) tessLoading = new Promise((res, rej)=>{
    const s = document.createElement("script"); s.src = TESS;
    s.onload = ()=> res(window.Tesseract);
    s.onerror = ()=>{ tessLoading = null; rej(new Error("Couldn't load the OCR reader. Check your connection and try again.")); };
    document.head.appendChild(s);
  });
  return tessLoading;
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
  return t.replace(/[−–—]/g,"-").replace(/[△Δ∆^]/g,"maj").replace(/Ø/g,"ø")
    .replace(/^[|:\[\]{}/\\!Il1]+(?=[A-G])/,"").replace(/[|:\[\]{}.,;'"`]+$/g,"");
}
/* extra clean-up for OCR text: common misreads in chord symbols */
function ocrToken(t){
  return cleanToken(t.replace(/[‘’´`]/g,"").replace(/(?<=^[A-G])(?:»|>|\$)/,"b"))
    .replace(/(?<=\d)[oO](?=$|\d)/,"0").replace(/(?<=^[A-G](?:b|#)?)(?:mi|min)(?=\d|$)/,"m");
}
function chordRows(lines, tok){
  const rows = []; let count = 0;
  lines.forEach(text=>{
    const words = text.split(/\s+/).map(tok).filter(Boolean);
    if(!words.length) return;
    const chords = words.filter(isChord);
    if(chords.length && chords.length >= words.length*0.5){ rows.push(chords.join(" ")); count += chords.length; }
  });
  return {rows, count};
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

/* OCR every page (max 4) and return its text lines, top to bottom */
async function ocrLines(doc, progress){
  const T = await tess();
  const worker = await T.createWorker("eng");
  const out = [];
  try{
    const n = Math.min(doc.numPages, 4);
    for(let p=1; p<=n; p++){
      progress && progress(`Reading page ${p} of ${n} with OCR…`);
      const page = await doc.getPage(p);
      const base = page.getViewport({scale:1});
      const vp = page.getViewport({scale: Math.min(3, 2200/base.width)});
      const c = document.createElement("canvas"); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0,0,c.width,c.height);
      await page.render({canvasContext:g, viewport:vp}).promise;
      const r = await worker.recognize(c);
      (r.data.text || "").split(/\n+/).forEach(t=>{ if(t.trim()) out.push(t); });
    }
  } finally { await worker.terminate(); }
  return out;
}

const GENERIC_TITLE = /^(untitled|claude|document|scan|image|img[_ -]?\d*|microsoft.*|.*\.(pdf|docx?|png|jpe?g))$/i;
async function read(blob, filename, progress){
  const doc = await open(blob);
  let textLines = [], titleGuess = "", allSizes = [], tops = [];
  for(let p=1; p<=doc.numPages; p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const lines = linesOf(tc.items);
    lines.forEach(l=>{ allSizes.push(l.size); textLines.push(l.text); });
    if(p===1){
      const vp = page.getViewport({scale:1});
      tops = lines.filter(l=> l.y > vp.height*0.6 && /[a-z]{2}/i.test(l.text) && !l.text.split(/\s+/).every(w=>isChord(cleanToken(w))));
    }
  }
  /* title: the biggest text near the top of page 1, if it is clearly bigger than the rest */
  allSizes.sort((a,b)=>a-b);
  const median = allSizes.length ? allSizes[Math.floor(allSizes.length/2)] : 0;
  const big = tops.sort((a,b)=> b.size-a.size)[0];
  if(big && big.size >= median*1.35) titleGuess = big.text.trim();

  let {rows, count} = chordRows(textLines, cleanToken), ocr = false;
  if(!count){
    /* no chord symbols in a text layer: a scanned chart, so read it with OCR */
    let lines = [];
    try{ lines = await ocrLines(doc, progress); }
    catch(e){ doc.destroy(); throw e; }
    ({rows, count} = chordRows(lines, ocrToken));
    ocr = true;
    /* title: the first line near the top that is words, not chords */
    if(!titleGuess){
      const t = lines.slice(0, 6).map(x=>x.trim()).find(x=> /[a-z]{3}/i.test(x) && x.length<=60 &&
        x.split(/\s+/).filter(w=>isChord(ocrToken(w))).length < x.split(/\s+/).length/2);
      if(t) titleGuess = t.replace(/[^\w\s'’&.,()?!-]/g,"").trim();
    }
  }

  if(!titleGuess){
    let meta = {};
    try{ const m = await doc.getMetadata(); meta = (m && m.info) || {}; }catch(e){}
    const t = (meta.Title || "").trim();
    const generic = !t || GENERIC_TITLE.test(t) || [meta.Author, meta.Creator, meta.Producer].some(x=> x && x.trim().toLowerCase()===t.toLowerCase());
    if(!generic) titleGuess = t;
  }
  if(!titleGuess && filename) titleGuess = filename.replace(/\.pdf$/i,"").replace(/[_]+/g," ").replace(/\s+-\s+.*$/,"").trim();
  titleGuess = titleGuess.replace(/\s{2,}/g," ").slice(0,80);
  const pages = doc.numPages;
  doc.destroy();
  return {changes: rows.join("\n"), count, title: titleGuess, pages, ocr};
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
