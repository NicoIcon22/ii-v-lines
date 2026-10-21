/* ii–V Lines page: builds the sheet, renders it with abcjs, plays it, and wires the tune box,
   chart PDF and My tunes. */
(function(){
const E = window.IIV, TUNES = window.TUNES, MY = window.MYTUNES, PDF = window.PDFCHART;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const store = {
  get(k){ try{ return localStorage.getItem("iiv-"+k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem("iiv-"+k, v); }catch(e){} }
};

/* ---------- pickers ---------- */
const MAJ_KEYS = ["C","Db","D","Eb","E","F","F#","Gb","G","Ab","A","Bb","B"];
const MIN_KEYS = ["Cm","C#m","Dm","Ebm","Em","Fm","F#m","Gm","G#m","Am","Bbm","Bm"];
const pk = k => E.prettyChord(k.replace(/m$/,"")) + (/m$/.test(k) ? " minor" : " major");
$("key").innerHTML = `<option value="">Tune's key</option><optgroup label="Major">${MAJ_KEYS.map(k=>`<option value="${k}">${pk(k)}</option>`).join("")}</optgroup><optgroup label="Minor">${MIN_KEYS.map(k=>`<option value="${k}">${pk(k)}</option>`).join("")}</optgroup>`;
$("tuneList").innerHTML = TUNES.map(t=>`<option value="${esc(t.t)}"></option>`).join("");

const norm = s => s.toLowerCase().replace(/♭/g,"b").replace(/♯/g,"#").replace(/^the\s+/,"").replace(/[^a-z0-9#]+/g," ").trim();
function findTune(q){
  const n = norm(q); if(!n) return null;
  return TUNES.find(t=> norm(t.t)===n || (t.aka||[]).some(a=>norm(a)===n)) || null;
}

/* ---------- build the sheet ---------- */
const ROMAN = ["I","♭II","II","♭III","III","IV","♯IV","V","♭VI","VI","♭VII","VII"];
let seed = 0, sheet = null;
let pdf = null;          /* {name, type, blob} attached to the tune on the page */
let pdfNote = "";        /* one-off message after reading a PDF */
let currentId = null, drawnBlob = null, tuneChangeP = null;
/* what to generate: lines per ii–V and length (long = one bar per chord, short = two beats) */
let opts = {e:1, b:1, len:"long"};
const OPT_DEFAULT = {e:1, b:1, len:"long"};
function cleanOpts(o){
  const e = Math.max(0, Math.min(3, parseInt(o && o.e, 10))), b = Math.max(0, Math.min(3, parseInt(o && o.b, 10)));
  const r = {e: isFinite(e) ? e : 1, b: isFinite(b) ? b : 1, len: ["long","short","both"].includes(o && o.len) ? o.len : "long"};
  if(!r.e && !r.b) r.e = 1;
  return r;
}
function showOpts(){
  $("nE").value = String(opts.e); $("nB").value = String(opts.b);
  document.querySelectorAll("#len button").forEach(x=>x.setAttribute("aria-pressed", x.dataset.l===opts.len ? "true" : "false"));
}

function keyLabel(k){ return E.prettyName(k.tonic) + (k.minor ? " minor" : ""); }

function buildSheet(){
  const typed = $("tune").value.trim();
  const lib = findTune(typed || "East of the Sun");
  const title = lib ? lib.t : typed;
  const chText = $("changes").value.trim();
  const parsed = chText ? E.parseChanges(chText) : null;
  const usePaste = parsed && parsed.targets.length > 0;
  const choice = $("key").value;

  /* source key and targets before any transposition */
  let srcKey, targets, notes = null, source;
  if(usePaste){
    const h = parsed.home || {root:parsed.targets[0].root, minor:parsed.targets[0].minor};
    srcKey = E.parseKey(E.nameStr(h.root) + (h.minor ? "m" : ""));
    targets = parsed.targets.map(t=>({root:t.root, minor:t.minor}));
    source = "paste";
  } else if(lib){
    srcKey = E.parseKey(lib.k);
    targets = lib.ii.map(s=>{ const m = /m$/.test(s); return {root:E.parseName(m ? s.slice(0,-1) : s), minor:m}; });
    notes = lib.n || null;
    source = "lib";
  } else {
    srcKey = E.parseKey(choice || "C");
    const t = srcKey.tonic;
    targets = srcKey.minor
      ? [{root:t, minor:true}, {root:E.moveName(t,2,3), minor:false}, {root:E.moveName(t,3,5), minor:true}]
      : [{root:t, minor:false}, {root:E.moveName(t,1,2), minor:true}, {root:E.moveName(t,3,5), minor:false}, {root:E.moveName(t,5,9), minor:true}];
    source = "default";
  }

  /* transpose to the chosen key */
  let key = srcKey, transposed = false;
  if(choice && source==="paste"){
    /* with pasted changes the menu names the home key; the ii–Vs stay where the changes put them */
    key = E.parseKey(choice);
  } else if(choice){
    /* the menu picks the tonic; a known tune keeps its own mode (a major tune stays major) */
    let want = E.parseKey(choice);
    if(source!=="default" && want.minor!==srcKey.minor) want = E.parseKey(E.nameStr(want.tonic) + (srcKey.minor ? "m" : ""));
    if(E.nameStr(want.tonic)!==E.nameStr(srcKey.tonic)){
      const iv = E.interval(srcKey.tonic, want.tonic);
      targets = targets.map(t=>({root:E.simplify(E.moveName(t.root, iv.steps, iv.semis)), minor:t.minor}));
      transposed = source!=="default";
      if(transposed) notes = null;
    }
    key = want;
  }
  const sigName = (lib && source==="lib" && !transposed && lib.sig) ? lib.sig : key.major;
  const sig = E.sigFor(sigName);

  /* home target first */
  const isHome = t => E.pcOf(t.root)===E.pcOf(key.tonic) && t.minor===key.minor;
  const hi = targets.findIndex(isHome);
  if(hi>0){ const [h] = targets.splice(hi,1); targets.unshift(h); if(notes){ notes = notes.slice(); const [n] = notes.splice(hi,1); notes.unshift(n); } }

  /* groups: for each ii–V, opts.e essential and opts.b bebop lines, long and/or short.
     Each count takes consecutive templates from the pool, starting at a point that moves with
     the ii–V's position and the variation, so lines in one section are all different. */
  const groups = []; const used = {major:0, minor:0};
  const wantLong = opts.len!=="short", wantShort = opts.len!=="long";
  const take = (pool, level, n, start, root, short) => {
    const out = [], arr = pool[level];
    for(let j=0; j<Math.min(n, arr.length); j++) out.push({level, short, ...E.realize(arr[(start + j) % arr.length], root, sig)});
    return out;
  };
  const linesFor = (root, minor, c) => {
    const L = E.T[minor ? "minor" : "major"], S = E.T[minor ? "fastMinor" : "fastMajor"], st = c + seed;
    let out = [];
    if(wantLong) out = out.concat(take(L,"essential",opts.e,st,root,false), take(L,"bebop",opts.b,st,root,false));
    if(wantShort) out = out.concat(take(S,"essential",opts.e,st,root,true), take(S,"bebop",opts.b,st,root,true));
    return out;
  };
  targets.forEach((t,i)=>{
    const c = used[t.minor ? "minor" : "major"]++;
    const lines = linesFor(t.root, t.minor, c);
    const semis = (E.pcOf(t.root) - E.pcOf(key.tonic) + 12) % 12;
    const rn = t.minor ? ROMAN[semis].toLowerCase() : ROMAN[semis];
    const tname = E.prettyName(t.root) + (t.minor ? " minor" : "");
    const home = isHome(t);
    const name = home ? "Home ii–V" : (t.minor ? `Into ${rn}` : `To ${rn}`);
    const desc = (notes && notes[i]) ? notes[i]
      : home ? `The ii–V back to the tonic, ${tname}. It closes sections and comes back in every turnaround.`
      : t.minor ? `A minor ii–V (half-diminished ii, ♭9 on the V) into ${tname}.`
      : `The ii–V to ${tname}. Use it wherever the chart moves to ${E.prettyName(t.root)}.`;
    const pc = lines[0].chords.map(c=>E.prettyChord(c.name));
    const path = lines[0].short ? `${pc[0]} ${pc[1]} → ${pc[2]}` : pc.join(" → ");
    groups.push({id:"g"+i, name, path, desc: wantShort && !wantLong ? desc + " Short lines: two beats per chord." : desc, lines, target:t});
  });

  /* with long lines only, the home key also gets a one-bar (short) section, as before */
  if(!wantShort){
    const S = E.T[key.minor ? "fastMinor" : "fastMajor"];
    const fl = take(S,"essential",opts.e,seed,key.tonic,true).concat(take(S,"bebop",opts.b,seed,key.tonic,true));
    const fc = fl[0].chords.map(c=>E.prettyChord(c.name));
    groups.push({id:"fast", name:"One-bar ii–V", path:`${fc[0]} ${fc[1]} → ${fc[2]}`,
      desc:"Two beats per chord, for bars where the changes move twice as fast.", lines:fl});
  }
  /* the chain is one long line; it comes with long lines */
  if(!key.minor && wantLong){
    const cl = [{level:"bebop", ...E.realize(E.T.chain.bebop[0], key.tonic, sig)}];
    groups.push({id:"chain", name:"The full chain", path: cl[0].chords.map(c=>E.prettyChord(c.name)).join(" → "),
      desc:"The minor ii–V into the ii chord, then the home ii–V, one bar per chord, as one continuous line.", lines:cl});
  }

  return {title, lib, key, sigName, sig, groups, targets, source, transposed, parsed, typed};
}

/* ---------- render page ---------- */
let clef = "treble", octave = "low", transpose = 0, narrow = window.innerWidth < 560;
const main = $("main");
let items = [];

function listJoin(a){ return a.length<2 ? a.join("") : a.slice(0,-1).join(", ") + " and " + a[a.length-1]; }

function generate(push){
  stop();
  sheet = buildSheet();
  const S = sheet, k = S.key;
  const keyTxt = keyLabel(k);
  $("title").textContent = S.title;
  if(S.lib) $("tune").value = S.lib.t;
  document.title = `${S.title} ii–V Lines`;
  const meta = S.lib ? [S.lib.c + (S.lib.y ? ", " + S.lib.y : "")] : ["Custom tune"];
  meta.push(`Concert ${S.lib && S.lib.sig && !S.transposed && S.source==="lib" ? S.targets.map(t=>E.prettyName(t.root)).join(" / ") : keyTxt}`);
  if(S.lib && S.lib.s) meta.push(S.lib.s);
  $("eyebrow").textContent = meta.join(" · ");

  const count = S.groups.reduce((a,g)=>a+g.lines.length,0);
  const homeT = S.targets.find(t=>E.pcOf(t.root)===E.pcOf(k.tonic) && t.minor===k.minor);
  const others = S.targets.filter(t=>t!==homeT).map(t=>E.prettyName(t.root) + (t.minor ? " minor" : ""));
  const words = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];
  let what = homeT
    ? `the home ii–V into ${keyTxt}` + (others.length ? `, plus the moves toward ${listJoin(others)}` : "")
    : `the ii–Vs into ${listJoin(others)}`;
  const nw = (x, one, many) => x===1 ? (/^[aeiou]/.test(one) ? "an " : "a ") + one : `${["","","two","three"][x]} ${many}`;
  const parts = [];
  if(opts.e) parts.push(nw(opts.e, "essential line", "essential lines") + " built on chord tones");
  if(opts.b) parts.push(nw(opts.b, "bebop line", "bebop lines") + " with ♭9s, enclosures and chromatic passing tones");
  const lenTxt = opts.len==="short" ? ", two beats per chord" : opts.len==="both" ? ", in a long and a short version" : "";
  $("lede").textContent = `${words[count]||count} lines for the ii–Vs in ${S.title}: ${what}. Each ii–V has ${parts.join(" and ")}${lenTxt}. Hit play to hear any line with a soft rhythm section, and switch the reading key for your horn.`;

  /* status line */
  let st;
  const n = S.targets.length;
  if(S.source==="paste") st = `Found <b>${n} ii–V${n>1?"s":""}</b> in the changes.` + (S.lib ? ` Using them instead of the library's list for ${esc(S.lib.t)}.` : "");
  else if(S.source==="lib") st = `<b>${esc(S.lib.t)}</b> is in the library: ${n} ii–V${n>1?"s":""} in ${keyTxt}${S.transposed ? `, transposed from ${esc(keyLabel(E.parseKey(S.lib.k)))}` : ""}. Pick another key to transpose, or paste your chart's changes to use those instead.`;
  else {
    const t = S.typed ? `“${esc(S.typed)}” isn't in the library yet, so these` : "These";
    st = `${t} are the common ii–Vs in ${keyTxt}: home, ${k.minor ? "the relative major and the iv" : "into ii, to IV and into vi"}. ${$("key").value ? "Paste" : "Choose the tune's key and paste"} its changes to get its exact ii–Vs.`;
    if(S.parsed) st = `No ii–Vs found in the pasted changes (looking for a m7 or m7♭5 followed by a dominant 7th a fourth higher). ` + st;
  }
  if(seed) st += ` Variation ${seed+1}.`;
  $("varyN").textContent = seed ? String(seed+1) : "";
  if(pdfNote){ st += " " + pdfNote; pdfNote = ""; }
  $("status").innerHTML = st;

  /* sections */
  main.innerHTML = ""; items = [];
  S.groups.forEach(g=>{
    const sec = document.createElement("section");
    sec.className = "group"; sec.id = g.id;
    sec.innerHTML = `<div class="ghead"><h2>${esc(g.name)}</h2><span class="path">${esc(g.path)}</span></div><p class="gdesc">${esc(g.desc)}</p>`;
    g.lines.forEach((l,i)=>{
      const card = document.createElement("div");
      card.className = "line" + (l.chords.reduce((a,c)=>a+c.beats,0) <= 8 ? " short" : "");
      const label = l.level==="essential" ? "Essential" : "Bebop";
      const lenTag = (opts.len==="both" && g.id!=="chain") ? `<span class="tag len">${l.short ? "Short" : "Long"}</span>` : "";
      card.innerHTML = `<div class="lhead"><span class="tag ${l.level}">${label}</span>${lenTag}
        <button class="play" type="button" aria-label="Play ${esc(g.name)}, ${l.short ? "short " : ""}${label} line"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg><span>Play</span></button></div>
        <div class="scorewrap"><div class="score"></div></div><p class="lnote">${l.note}</p>`;
      sec.appendChild(card);
      const it = {l, card, score:card.querySelector(".score"), btn:card.querySelector(".play"), vo:null};
      items.push(it);
      it.btn.addEventListener("click", ()=> (playing && playing.it===it) ? stop() : play(it));
    });
    main.appendChild(sec);
  });
  renderAll();

  /* url + memory */
  const p = new URLSearchParams();
  p.set("tune", S.title);
  if($("key").value) p.set("key", $("key").value);
  if($("changes").value.trim()) p.set("changes", $("changes").value.trim());
  if(seed) p.set("v", String(seed+1));
  if(opts.e!==OPT_DEFAULT.e) p.set("e", String(opts.e));
  if(opts.b!==OPT_DEFAULT.b) p.set("b", String(opts.b));
  if(opts.len!==OPT_DEFAULT.len) p.set("len", opts.len);
  const url = location.pathname + "?" + p.toString();
  try{ history[push ? "pushState" : "replaceState"](null, "", url); }catch(e){}
  store.set("last", p.toString());

  showChart();
  saveCurrent(S);
}

/* ---------- chart PDF ---------- */
function showChart(){
  const wrap = $("chartWrap"), box = $("pages");
  if(pdf){
    wrap.hidden = false;
    $("chartName").textContent = pdf.name;
    $("pdfName").textContent = pdf.name; $("pdfChip").hidden = false;
    if(drawnBlob!==pdf.blob){
      drawnBlob = pdf.blob;
      PDF.draw(pdf.blob, box).catch(()=>{ box.innerHTML = `<p class="empty">This PDF couldn't be displayed.</p>`; });
    }
  } else {
    wrap.hidden = true; box.innerHTML = ""; drawnBlob = null;
    $("pdfChip").hidden = true; $("pdfName").textContent = "";
  }
}

async function handleFile(file){
  if(!file) return;
  if(!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)){ $("status").textContent = `${file.name} isn't a PDF.`; return; }
  if(file.size > 40*1024*1024){ $("status").textContent = `${file.name} is over 40 MB. Try a smaller export of the chart.`; return; }
  const name = file.name || "chart.pdf";
  $("status").textContent = `Reading ${name}…`;
  pdf = {name, type:"application/pdf", blob:file};
  let r = null;
  try{ r = await PDF.read(file, name); }
  catch(e){ pdfNote = `Couldn't read ${esc(name)}: ${esc(e.message || "unknown error")}.`; }
  if(r){
    if(r.title) $("tune").value = r.title;
    $("key").value = "";
    if(r.count){
      $("changes").value = r.changes; $("chgBox").open = true;
      pdfNote = `Read <b>${r.count} chord symbols</b> from ${esc(name)}; they're in the changes box if you want to check or edit them.`;
    } else {
      $("changes").value = "";
      pdfNote = `No chord symbols found in the text of ${esc(name)} (a scanned chart has none). It's shown below; paste its changes to get its exact ii–Vs.`;
    }
  }
  seed = 0;
  generate(true);
}

/* ---------- my tunes ---------- */
const fmtDate = t => new Date(t).toLocaleDateString(undefined, {month:"short", day:"numeric", year: new Date(t).getFullYear()===new Date().getFullYear() ? undefined : "numeric"});

async function saveCurrent(S){
  const id = norm(S.title); if(!id) return;
  const cur = await MY.get(id), now = Date.now();
  const rec = {id, title:S.title, key:$("key").value, changes:$("changes").value.trim(), seed, opts:Object.assign({}, opts),
    pdf: pdf ? {name:pdf.name, type:pdf.type || "application/pdf", blob:pdf.blob} : null,
    keyLabel: keyLabel(S.key), targets: S.targets.map(t=>E.prettyName(t.root) + (t.minor ? "m" : "")),
    lib: !!S.lib, created: cur ? cur.created : now, updated: now};
  const r = await MY.put(rec);
  if(r==="nopdf") $("status").insertAdjacentText("beforeend", " This browser couldn't store the PDF, so the tune was saved without it.");
  currentId = id;
  renderMine();
}

async function renderMine(){
  const list = await MY.all(), q = norm($("mineFilter").value || "");
  $("mineCount").textContent = list.length ? `(${list.length})` : "";
  const ul = $("mineList"); ul.innerHTML = "";
  const shown = q ? list.filter(r=> r.id.includes(q)) : list;
  if(!shown.length){ ul.innerHTML = `<li class="empty">${list.length ? "No tunes match." : "Nothing yet. Generate lines for a tune and it shows up here."}</li>`; return; }
  shown.forEach(r=>{
    const li = document.createElement("li");
    const n = (r.targets||[]).length;
    li.innerHTML = `<button type="button" class="open"${r.id===currentId ? ' aria-current="true"' : ""}><span class="t">${esc(r.title)}</span>
      <span class="m">${esc(r.keyLabel||"")} · ${n} ii–V${n===1?"":"s"}${r.changes ? " · own changes" : ""}${r.pdf ? " · PDF" : ""}${r.seed ? ` · variation ${r.seed+1}` : ""}${r.opts && (r.opts.e!==1 || r.opts.b!==1) ? ` · ${r.opts.e}+${r.opts.b} lines` : ""}${r.opts && r.opts.len!=="long" ? ` · ${r.opts.len==="both" ? "long + short" : "short"}` : ""} · ${fmtDate(r.updated)}</span></button>
      <button type="button" class="del" aria-label="Delete ${esc(r.title)} from my tunes" title="Delete">×</button>`;
    li.querySelector(".open").addEventListener("click", ()=> openRec(r));
    const del = li.querySelector(".del"); let armed = null;
    del.addEventListener("click", async ()=>{
      if(!armed){ del.classList.add("armed"); del.textContent = "Delete?"; armed = setTimeout(()=>{ armed = null; del.classList.remove("armed"); del.textContent = "×"; }, 3000); return; }
      clearTimeout(armed); await MY.del(r.id); if(currentId===r.id) currentId = null; renderMine();
    });
    ul.appendChild(li);
  });
}

function openRec(r){
  $("tune").value = r.title;
  $("key").value = r.key || "";
  $("changes").value = r.changes || ""; $("chgBox").open = !!r.changes;
  seed = r.seed || 0;
  pdf = r.pdf || null;
  if(r.opts){ opts = cleanOpts(r.opts); showOpts(); }
  generate(true);
  window.scrollTo({top:0, behavior:"smooth"});
}
$("mineFilter").addEventListener("input", renderMine);
$("exportBtn").addEventListener("click", async ()=>{
  const blob = await MY.exportAll(), a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ii-v-lines-my-tunes-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
});
$("importBtn").addEventListener("click", ()=> $("importFile").click());
$("importFile").addEventListener("change", async e=>{
  const f = e.target.files[0]; e.target.value = ""; if(!f) return;
  try{ const r = await MY.importFile(f); $("status").textContent = `Imported ${r.added} new tune${r.added===1?"":"s"}${r.updated ? ` and updated ${r.updated}` : ""}.`; renderMine(); }
  catch(err){ $("status").textContent = `Couldn't import ${f.name}: ${err.message}`; }
});

function octShift(){ return octave==="low" ? -1 : 0; }

function renderAll(){
  if(!window.ABCJS || !sheet) return;
  narrow = window.innerWidth < 560;
  const head = `X:1\nM:4/4\nL:1/8\nK:${sheet.sigName}${clef==="bass" ? " clef=bass" : ""}\n`;
  let lo = null, hi = null;
  items.forEach(it=>{
    const bars = it.l.chords.reduce((a,c)=>a+c.beats,0)/4;
    const opts = !narrow ? {staffwidth: bars>3 ? 820 : (bars>2 ? 660 : 480)}
      : bars>3 ? {staffwidth:520, wrap:{minSpacing:1, maxSpacing:2.4, preferredMeasuresPerLine:3}}
      : {staffwidth: bars>2 ? 520 : 400};
    const src = head + E.lineAbc(it.l, sheet.sig, octShift());
    it.vo = ABCJS.renderAbc(it.score, src, Object.assign(opts, {
      responsive:"resize", add_classes:true, visualTranspose:transpose,
      paddingtop:4, paddingbottom:4, paddingleft:0, paddingright:2,
      foregroundColor:"currentColor",
      format:{gchordfont:"IBM Plex Mono 14", annotationfont:"Work Sans 12"}
    }))[0];
    it.events = E.lineEvents(it.l, octShift());
    it.l.toks.forEach(t=>{
      if(t.t!=="note") return;
      const n = {step:t.step + 7*octShift(), alter:t.alter}, m = E.midiOf(n);
      if(!lo || m < lo.m) lo = {m, n};
      if(!hi || m > hi.m) hi = {m, n};
    });
  });
  const nm = x => E.LET[((x.n.step%7)+7)%7] + E.glyph(x.n.alter) + Math.floor(x.n.step/7);
  $("range").textContent = lo ? `${octave==="low" ? "In the lower octave" : "In the original octave"} the notes run from ${nm(lo)} to ${nm(hi)} concert.` : "";
}

/* ---------- audio ---------- */
let ctx = null, master = null, playing = null;
function ensureCtx(){
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  }
  if(ctx.state==="suspended") ctx.resume();
}
const hz = m => 440*Math.pow(2,(m-69)/12);

function tone(m, t, dur, opts, bag){
  const o = opts||{}; const g = ctx.createGain();
  const peak = o.vol||0.18, a = o.attack||0.012;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(peak,t+a);
  g.gain.exponentialRampToValueAtTime(peak*(o.sustain||0.55),t+a+0.12);
  g.gain.setValueAtTime(peak*(o.sustain||0.55),Math.max(t+a+0.12,t+dur-0.04));
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur+(o.release||0.06));
  const f = ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value = o.cutoff||2600;
  g.connect(f); f.connect(master);
  (o.waves||["triangle"]).forEach((w,i)=>{
    const osc = ctx.createOscillator(); osc.type = w;
    osc.frequency.value = hz(m) * (i===1 && o.octave ? 2 : 1);
    if(i>0){ const g2=ctx.createGain(); g2.gain.value=o.mix||0.25; osc.connect(g2); g2.connect(g); }
    else osc.connect(g);
    osc.start(t); osc.stop(t+dur+(o.release||0.06)+0.05); bag.push(osc);
  });
}
function tick(t, vol, bag, hi){
  const len = 0.05, buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate*len), ctx.sampleRate);
  const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const s = ctx.createBufferSource(); s.buffer=buf;
  const f = ctx.createBiquadFilter(); f.type="highpass"; f.frequency.value = hi?7000:3500;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(master); s.start(t); bag.push(s);
}
function swingBeat(b, on){
  if(!on) return b;
  const s = 2/3, base = Math.floor(b+1e-9), fr = b-base;
  return base + (fr<0.5 ? fr*(s/0.5) : s+(fr-0.5)*((1-s)/0.5));
}

function play(it){
  stop(); ensureCtx();
  const bpm = +$("tempo").value, sw = $("swing").checked, compOn = $("comp").checked;
  const spb = 60/bpm, bag = [], timers = [];
  const t0 = ctx.currentTime + 0.12, start = t0 + 4*spb;
  for(let i=0;i<4;i++) tick(t0+i*spb, i===0?0.5:0.32, bag, false);

  it.events.forEach(e=>{
    const b0 = swingBeat(e.start, sw), b1 = swingBeat(e.start+e.dur, sw);
    const dur = Math.max(0.06,(b1-b0)*spb*0.92);
    tone(e.pitch, start+b0*spb, dur, {vol:0.2, waves:["triangle","sine"], octave:true, mix:0.18, sustain:0.6, cutoff:3200}, bag);
  });

  let beat = 0;
  it.l.chords.forEach(c=>{
    const len = c.beats, v = E.voicing(c.name);
    if(compOn){
      v.notes.forEach(m=> tone(m, start+beat*spb, len*spb*0.9, {vol:0.04, waves:["sine","triangle"], mix:0.3, sustain:0.45, release:0.25, cutoff:1800}, bag));
      tone(v.root, start+beat*spb, (len>=4?2:len)*spb*0.9, {vol:0.22, waves:["sine","triangle"], mix:0.2, sustain:0.6, cutoff:700}, bag);
      if(len>=4) tone(v.fifth, start+(beat+2)*spb, 2*spb*0.9, {vol:0.2, waves:["sine","triangle"], mix:0.2, sustain:0.6, cutoff:700}, bag);
    }
    for(let k=0;k<len;k++){ if((beat+k)%2===1) tick(start+(beat+k)*spb, 0.12, bag, true); }
    beat += len;
  });

  /* highlight notes on the displayed score */
  let last = [];
  if(it.vo){
    const timing = new ABCJS.TimingCallbacks(it.vo, {qpm:120});
    const now = ctx.currentTime;
    timing.noteTimings.forEach(ev=>{
      if(ev.type!=="event" || !ev.elements) return;
      const b = swingBeat(ev.milliseconds/500, sw);
      const at = (start + b*spb - now)*1000;
      timers.push(setTimeout(()=>{
        last.forEach(el=>el.classList.remove("hl"));
        last = [].concat(...ev.elements).filter(Boolean);
        last.forEach(el=>el.classList.add("hl"));
      }, Math.max(0,at)));
    });
  }
  const endMs = (start + beat*spb - ctx.currentTime)*1000;
  timers.push(setTimeout(()=>{
    last.forEach(el=>el.classList.remove("hl"));
    if($("loop").checked && playing && playing.it===it) play(it); else stop();
  }, endMs + 60));

  playing = {it, bag, timers, clear:()=>last.forEach(el=>el.classList.remove("hl"))};
  it.btn.classList.add("on"); it.btn.querySelector("span").textContent = "Stop";
}

function stop(){
  if(!playing) return;
  playing.timers.forEach(clearTimeout);
  playing.bag.forEach(n=>{ try{ n.stop(); }catch(e){} });
  playing.clear();
  const b = playing.it.btn; b.classList.remove("on"); b.querySelector("span").textContent = "Play";
  playing = null;
}

/* ---------- controls ---------- */
const tempo = $("tempo"), tv = $("tempoVal");
tempo.addEventListener("input", ()=>{ tv.textContent = tempo.value; });
function seg(id, attr, onPick){
  document.querySelectorAll(`#${id} button`).forEach(b=>{
    b.addEventListener("click", ()=>{
      document.querySelectorAll(`#${id} button`).forEach(x=>x.setAttribute("aria-pressed", x===b ? "true":"false"));
      onPick(b.dataset[attr]); stop(); renderAll();
    });
  });
}
function setSeg(id, attr, val){
  document.querySelectorAll(`#${id} button`).forEach(x=>x.setAttribute("aria-pressed", x.dataset[attr]===String(val) ? "true":"false"));
}
seg("transpose","t", v=>{ transpose = +v; store.set("transpose", v); });
seg("clef","c", v=>{ clef = v; store.set("clef", v); });
seg("octave","o", v=>{ octave = v; store.set("octave", v); });
(function restore(){
  const t = store.get("transpose"); if(t==="0"||t==="2"||t==="9"){ transpose = +t; setSeg("transpose","t",t); }
  const c = store.get("clef"); if(c==="treble"||c==="bass"){ clef = c; setSeg("clef","c",c); }
  const o = store.get("octave"); if(o==="low"||o==="orig"){ octave = o; setSeg("octave","o",o); }
})();

$("tuneForm").addEventListener("submit", async e=>{ e.preventDefault(); if(tuneChangeP) await tuneChangeP; seed = 0; generate(true); });
$("pdfBtn").addEventListener("click", ()=> $("pdf").click());
$("pdf").addEventListener("change", e=>{ const f = e.target.files[0]; e.target.value = ""; handleFile(f); });
$("pdfRemove").addEventListener("click", ()=>{ pdf = null; generate(false); });
const form = $("tuneForm");
["dragenter","dragover"].forEach(t=> form.addEventListener(t, e=>{ if([...(e.dataTransfer?.types||[])].includes("Files")){ e.preventDefault(); form.classList.add("drag"); } }));
["dragleave","drop"].forEach(t=> form.addEventListener(t, e=>{ if(t==="dragleave" && form.contains(e.relatedTarget)) return; form.classList.remove("drag"); }));
form.addEventListener("drop", e=>{ const f = e.dataTransfer?.files?.[0]; if(f){ e.preventDefault(); handleFile(f); } });
/* lines per ii–V and length: regenerate on change, keep the variation */
function setOpts(change, changed){
  const o = Object.assign({}, opts, change);
  if(!o.e && !o.b){ if(changed==="e") o.b = 1; else o.e = 1; }
  opts = cleanOpts(o); showOpts(); generate(false);
}
$("nE").addEventListener("change", ()=> setOpts({e:+$("nE").value}, "e"));
$("nB").addEventListener("change", ()=> setOpts({b:+$("nB").value}, "b"));
document.querySelectorAll("#len button").forEach(b=> b.addEventListener("click", ()=> setOpts({len:b.dataset.l})));
$("vary").addEventListener("click", ()=>{
  const before = items.map(it=>it.l.note);
  seed++; generate(false);
  /* feedback: flash the button, badge the variation number, and flash each line that changed */
  const b = $("vary"); b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
  clearTimeout(b._t); b._t = setTimeout(()=>b.classList.remove("pulse"), 600);
  items.forEach((it,i)=>{ if(it.l.note!==before[i]) it.card.classList.add("fresh"); });
  setTimeout(()=> items.forEach(it=>it.card.classList.remove("fresh")), 800);
});
$("tune").addEventListener("change", ()=>{
  /* Switching to another tune: a saved tune brings back its key, changes and PDF; a library
     tune starts clean. Any other title counts as renaming the tune on the page, so its
     changes and PDF stay. */
  const v = $("tune").value, id = norm(v);
  if(!id || (sheet && id===norm(sheet.title))) return;
  tuneChangeP = MY.get(id).then(r=>{
    if(r){ $("key").value = r.key || ""; $("changes").value = r.changes || ""; $("chgBox").open = !!r.changes; pdf = r.pdf || null; }
    else if(findTune(v)){ $("key").value = ""; $("changes").value = ""; pdf = null; }
    tuneChangeP = null;
  });
});

/* initial state: URL, then last session, then East of the Sun */
function loadParams(qs){
  const p = new URLSearchParams(qs);
  $("tune").value = p.get("tune") || "East of the Sun (and West of the Moon)";
  const k = p.get("key"); $("key").value = (k && [...MAJ_KEYS, ...MIN_KEYS].includes(k)) ? k : "";
  const ch = p.get("changes") || ""; $("changes").value = ch; if(ch) $("chgBox").open = true;
  const v = parseInt(p.get("v")||"1",10); seed = isFinite(v) && v>1 ? v-1 : 0;
  /* settings left out of the query are the defaults (a bare visit loads the last query, which has them) */
  opts = cleanOpts({e: p.has("e") ? p.get("e") : OPT_DEFAULT.e, b: p.has("b") ? p.get("b") : OPT_DEFAULT.b, len: p.get("len") || OPT_DEFAULT.len});
  showOpts();
}
async function pdfFor(title){ const r = await MY.get(norm(title || "")); return r && r.pdf ? r.pdf : null; }
window.addEventListener("popstate", async ()=>{ loadParams(location.search); pdf = await pdfFor($("tune").value); generate(false); });

(async function init(){
  loadParams(location.search.length>1 ? location.search : (store.get("last") || ""));
  pdf = await pdfFor($("tune").value);
  generate(false);
  if(!(await MY.persistent())) $("mineHint").textContent = "This browser isn't letting the page store data (a private window, perhaps), so the list only lasts until you close the page. Export it to keep a copy.";
})();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll);
let rt;
window.addEventListener("resize", ()=>{ clearTimeout(rt); rt = setTimeout(()=>{ if((window.innerWidth<560)!==narrow){ stop(); renderAll(); } }, 150); });
})();
