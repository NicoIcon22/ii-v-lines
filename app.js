/* ii–V Lines page: builds the sheet, renders it with abcjs, plays it, and wires the tune box,
   chart PDF and My tunes. */
(function(){
const E = window.IIV, TUNES = window.TUNES, MY = window.MYTUNES, PDF = window.PDFCHART;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
/* every template gets a stable id ("major.bebop.2") so a kept line can be found again */
const TPL = {};
for(const g in E.T) for(const l in E.T[g]) E.T[g][l].forEach((tp,i)=>{ tp._id = `${g}.${l}.${i}`; TPL[tp._id] = tp; });
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
/* per-line state, by slot ("t-3|bebop|l|0" = 1st long bebop line of the ii–V into E♭):
   {keep, oct (null = follow the Octave setting, else -1/0/1), print, tid (template id)}.
   It belongs to one tune/key/changes; switching to another starts fresh (or from My tunes). */
let lineState = {}, ctxKey = null, pendingState = null;
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

/* ---------- names in the reading key ("Read for" B♭ / E♭) ----------
   Text on the page (chord paths, section notes, the note under each line) is written in
   the same key as the notation: concert, or up a major 2nd (B♭) or a major 6th (E♭). */
const HORN = {0:[0,0], 2:[1,2], 9:[5,9]};
const KEYS_OK = new Set(["C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab","Db","Gb","Cb"]);
/* the written interval: a major 2nd / major 6th up, unless that lands the tune in a key
   nobody writes (G♯, D♯...), then the enharmonic one (A♭, E♭...) */
const noSig = () => !!(sheet && sheet.lib && sheet.lib.sig && sheet.source==="lib" && !sheet.transposed);
function hornIv(){
  const base = HORN[transpose] || [0,0];
  if(!transpose || !sheet) return base;
  const k = E.parseName(noSig() ? sheet.key.major : sheet.sigName);
  if(KEYS_OK.has(E.nameStr(E.moveName(k, base[0], base[1])))) return base;
  const alt = [base[0]+1, base[1]];
  return KEYS_OK.has(E.nameStr(E.moveName(k, alt[0], alt[1]))) ? alt : base;
}
function hornN(n){
  const [st, se] = hornIv();
  const r = E.moveName(n, st, se);
  return Math.abs(r.alter)>1 ? E.simplify(r) : r;
}
const hornName = n => E.prettyName(hornN(n));
function hornChord(name){ const p = E.parseName(name); return p ? hornName(p) + E.prettyChord("C" + p.rest).slice(1) : name; }
function hornKey(k){ return hornName(k.tonic) + (k.minor ? " minor" : ""); }
function hornSigName(){
  if(!transpose) return sheet.sigName;
  if(noSig()) return "C";
  let n = E.nameStr(hornN(E.parseName(sheet.sigName)));
  if(!KEYS_OK.has(n)) n = E.nameStr(E.simplify(E.parseName(n)));
  return n;
}
const hornSig = () => E.sigFor(hornSigName());
/* the line as written for the horn: notes moved by the written interval, chords renamed */
function hornLine(l){
  if(!transpose) return l;
  const [st, se] = hornIv();
  const toks = l.toks.map(t=>{
    if(t.t!=="note") return t;
    let step = t.step + st; const midi = E.midiOf(t) + se;
    let alter = midi - E.midiOf({step, alter:0});
    /* never more than a double accidental: respell on the next letter */
    while(alter > 2){ step++; alter = midi - E.midiOf({step, alter:0}); }
    while(alter < -2){ step--; alter = midi - E.midiOf({step, alter:0}); }
    return {t:"note", step, alter, dur:t.dur};
  });
  return {toks, chords: l.chords.map(c=>{ const p = E.parseName(c.name); return {name: E.nameStr(hornN(p)) + p.rest, beats:c.beats}; })};
}
/* chord and key names inside free text (the library's notes): a letter counts as a chord or
   key name when it has an accidental or a chord suffix, is followed by "minor"/"major",
   or comes right after an arrow; "the A section" or "bar 2" are left alone */
function hornText(str){
  if(!transpose || !str) return str;
  return str.replace(/(^|[^A-Za-z0-9])([A-G])([♭♯]?)((?:maj7|maj9|m7♭5|m9|m7|m6|m11|m|7♭9|7♯9|7♭13|7alt|7|9|11|13|6|ø7?|°7?)?)(?![A-Za-z0-9♭♯])/g,
    (m, pre, L, acc, suf, off, all)=>{
      const after = all.slice(off + m.length), before = all.slice(0, off + pre.length);
      if(!acc && !suf && !/^ (minor|major)\b/.test(after) && !/→\s*$/.test(before)) return m;
      return pre + hornName(E.parseName(L + (acc==="♭" ? "b" : acc==="♯" ? "#" : ""))) + suf;
    });
}
function lineNote(l){
  if(!transpose) return l.note;
  const tp = TPL[l.tid];
  return tp ? E.realize(tp, hornN(l.root), hornSig()).note : l.note;
}
function groupPath(g){
  const l = g.lines[0], ch = l.chords.map(c=>hornChord(c.name));
  return l.short ? `${ch[0]} ${ch[1]} → ${ch[2]}` : ch.join(" → ");
}

/* V7 → I in the changes with no ii in front: practise it as a ii–V (the ii is added) */
function impliedTargets(parsed, have){
  const out = [], cs = parsed.chords, mod12 = x => ((x%12)+12)%12;
  for(let i=0; i<cs.length-1; i++){
    const v = cs[i], t = cs[i+1], prev = cs[i-1];
    if(v.type!=="dom" || !(t.type==="maj" || t.type==="min") || mod12(E.pcOf(t.root)-E.pcOf(v.root))!==5) continue;
    if(prev && (prev.type==="min" || prev.type==="hd") && mod12(E.pcOf(v.root)-E.pcOf(prev.root))===5) continue;
    const minor = t.type==="min", id = E.pcOf(t.root) + (minor ? "m" : "");
    if(have.some(x=>x.id===id) || out.some(x=>x.id===id)) continue;
    out.push({id, root:E.simplify(t.root), minor, implied:true, from:E.prettyChord(E.nameStr(v.root)+v.q) + " → " + E.prettyChord(E.nameStr(t.root)+t.q)});
  }
  return out;
}

function buildSheet(){
  const typed = $("tune").value.trim();
  const lib = findTune(typed || "East of the Sun");
  const title = lib ? lib.t : typed;
  const chText = $("changes").value.trim();
  const parsed = chText ? E.parseChanges(chText) : null;
  const implied = parsed ? impliedTargets(parsed, parsed.targets) : [];
  const usePaste = parsed && (parsed.targets.length + implied.length) > 0;
  const choice = $("key").value;

  /* source key and targets before any transposition */
  let srcKey, targets, notes = null, source;
  if(usePaste){
    const h = parsed.home || {root:parsed.targets[0].root, minor:parsed.targets[0].minor};
    srcKey = E.parseKey(E.nameStr(h.root) + (h.minor ? "m" : ""));
    targets = parsed.targets.map(t=>({root:t.root, minor:t.minor})).concat(implied.map(t=>({root:t.root, minor:t.minor, implied:t.from})));
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
      targets = targets.map(t=>({root:E.simplify(E.moveName(t.root, iv.steps, iv.semis)), minor:t.minor, implied:t.implied}));
      transposed = source!=="default";
      if(transposed) notes = null;
    }
    key = want;
  }
  const sigName = (lib && source==="lib" && !transposed && lib.sig) ? lib.sig : key.major;
  const sig = E.sigFor(sigName);
  const ctx = [title, E.nameStr(key.tonic) + (key.minor ? "m" : ""), chText].join("|");
  if(ctx!==ctxKey){ lineState = pendingState || {}; ctxKey = ctx; }
  pendingState = null;

  /* home target first */
  const isHome = t => E.pcOf(t.root)===E.pcOf(key.tonic) && t.minor===key.minor;
  const hi = targets.findIndex(isHome);
  if(hi>0){ const [h] = targets.splice(hi,1); targets.unshift(h); if(notes){ notes = notes.slice(); const [n] = notes.splice(hi,1); notes.unshift(n); } }

  /* groups: for each ii–V, opts.e essential and opts.b bebop lines, long and/or short.
     Each count takes consecutive templates from the pool, starting at a point that moves with
     the ii–V's position and the variation, so lines in one section are all different. */
  const groups = []; const used = {major:0, minor:0};
  const wantLong = opts.len!=="short", wantShort = opts.len!=="long";
  /* n lines of one level from a pool for one section. Kept lines stay in their slots (even if
     the count went down); the other slots get the next templates in the rotation, skipping
     any template a kept line already uses. */
  const take = (gid, pool, level, n, start, root, short) => {
    const arr = pool[level], out = [], pre = `${gid}|${level}|${short ? "s" : "l"}|`;
    const kept = Object.keys(lineState).filter(sl=> sl.startsWith(pre) && lineState[sl].keep && TPL[lineState[sl].tid]);
    const keptIds = new Set(kept.map(sl=>lineState[sl].tid));
    const fresh = [];
    for(let j=0; j<arr.length; j++){ const tp = arr[(start + j) % arr.length]; if(!keptIds.has(tp._id)) fresh.push(tp); }
    const slots = new Set(); for(let j=0; j<n; j++) slots.add(j);
    kept.forEach(sl=> slots.add(+sl.slice(pre.length)));
    let fi = 0;
    [...slots].sort((a,b)=>a-b).forEach(j=>{
      const slot = pre + j, st = lineState[slot];
      let tp;
      if(st && st.keep && TPL[st.tid]) tp = TPL[st.tid];
      else {
        tp = fresh[fi++]; if(!tp) return;
        if(!st || st.tid!==tp._id) lineState[slot] = {keep:false, oct:null, print:true, tid:tp._id};
      }
      out.push({level, short, slot, root, tid:tp._id, kept: !!(lineState[slot].keep), ...E.realize(tp, root, sig)});
    });
    return out;
  };
  const linesFor = (gid, root, minor, c) => {
    const L = E.T[minor ? "minor" : "major"], S = E.T[minor ? "fastMinor" : "fastMajor"], st = c + seed;
    let out = [];
    if(wantLong) out = out.concat(take(gid,L,"essential",opts.e,st,root,false), take(gid,L,"bebop",opts.b,st,root,false));
    if(wantShort) out = out.concat(take(gid,S,"essential",opts.e,st,root,true), take(gid,S,"bebop",opts.b,st,root,true));
    return out;
  };
  targets.forEach((t,i)=>{
    const c = used[t.minor ? "minor" : "major"]++;
    const gid = `t-${E.pcOf(t.root)}${t.minor ? "m" : ""}`;
    const lines = linesFor(gid, t.root, t.minor, c);
    if(!lines.length) return;
    const semis = (E.pcOf(t.root) - E.pcOf(key.tonic) + 12) % 12;
    const rn = t.minor ? ROMAN[semis].toLowerCase() : ROMAN[semis];
    const tname = E.prettyName(t.root) + (t.minor ? " minor" : "");
    const home = isHome(t);
    const name = home ? "Home ii–V" : (t.minor ? `Into ${rn}` : `To ${rn}`);
    const desc = (notes && notes[i]) ? notes[i]
      : home ? `The ii–V back to the tonic, ${tname}. It closes sections and comes back in every turnaround.`
      : t.minor ? `A minor ii–V (half-diminished ii, ♭9 on the V) into ${tname}.`
      : `The ii–V to ${tname}. Use it wherever the chart moves to ${E.prettyName(t.root)}.`;
    const impl = t.implied ? ` The chart has ${t.implied} with no ii in front; the ii is added here so you can practise the whole ii–V.` : "";
    const pc = lines[0].chords.map(c=>E.prettyChord(c.name));
    const path = lines[0].short ? `${pc[0]} ${pc[1]} → ${pc[2]}` : pc.join(" → ");
    groups.push({id:gid, name, path, desc: desc + impl + (wantShort && !wantLong ? " Short lines: two beats per chord." : ""), lines, target:t});
  });

  /* with long lines only, the home key also gets a one-bar (short) section, as before */
  if(!wantShort && (opts.e || opts.b)){
    const S = E.T[key.minor ? "fastMinor" : "fastMajor"];
    const fl = take("fast",S,"essential",opts.e,seed,key.tonic,true).concat(take("fast",S,"bebop",opts.b,seed,key.tonic,true));
    const fc = fl[0].chords.map(c=>E.prettyChord(c.name));
    groups.push({id:"fast", name:"One-bar ii–V", path:`${fc[0]} ${fc[1]} → ${fc[2]}`,
      desc:"Two beats per chord, for bars where the changes move twice as fast.", lines:fl});
  }
  /* the chain is one long line; it comes with long lines */
  if(!key.minor && wantLong){
    const cl = take("chain",E.T.chain,"bebop",1,0,key.tonic,false);
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
  if(transpose) meta.push(`${transpose===2 ? "B♭" : "E♭"} instruments: ${hornKey(k)}`);
  $("eyebrow").textContent = meta.join(" · ");

  const count = S.groups.reduce((a,g)=>a+g.lines.length,0);
  const homeT = S.targets.find(t=>E.pcOf(t.root)===E.pcOf(k.tonic) && t.minor===k.minor);
  const others = S.targets.filter(t=>t!==homeT).map(t=>hornName(t.root) + (t.minor ? " minor" : ""));
  const words = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"];
  let what = homeT
    ? `the home ii–V into ${hornKey(k)}` + (others.length ? `, plus the moves toward ${listJoin(others)}` : "")
    : `the ii–Vs into ${listJoin(others)}`;
  const nw = (x, one, many) => x===1 ? (/^[aeiou]/.test(one) ? "an " : "a ") + one : `${["","","two","three"][x]} ${many}`;
  const parts = [];
  if(opts.e) parts.push(nw(opts.e, "essential line", "essential lines") + " built on chord tones");
  if(opts.b) parts.push(nw(opts.b, "bebop line", "bebop lines") + " with ♭9s, enclosures and chromatic passing tones");
  const lenTxt = opts.len==="short" ? ", two beats per chord" : opts.len==="both" ? ", in a long and a short version" : "";
  $("lede").textContent = `${words[count]||count} lines for the ii–Vs in ${S.title}: ${what}. Each ii–V has ${parts.join(" and ")}${lenTxt}. Hit play to hear any line with a soft rhythm section, and switch the reading key for your horn.${transpose ? ` Chord and note names are for ${transpose===2 ? "B♭" : "E♭"} instruments, like the notation.` : ""}`;

  /* status line */
  let st;
  const n = S.targets.length;
  const nImp = S.targets.filter(t=>t.implied).length;
  const found = `<b>${n-nImp} ii–V${n-nImp===1?"":"s"}</b>` + (nImp ? ` and <b>${nImp} V–I${nImp===1?"":"s"}</b> (practised with the ii added)` : "");
  if(S.source==="paste") st = (pdf ? `Using the chord changes from <b>${esc(pdf.name)}</b>: ${found}.` : `Found ${found} in the changes.`) + (S.lib ? ` They replace the library's list for ${esc(S.lib.t)}.` : "");
  else if(S.source==="lib") st = `<b>${esc(S.lib.t)}</b> is in the library: ${n} ii–V${n>1?"s":""} in ${keyTxt}${S.transposed ? `, transposed from ${esc(keyLabel(E.parseKey(S.lib.k)))}` : ""}. Pick another key to transpose, or paste your chart's changes to use those instead.`;
  else {
    const t = S.typed ? `“${esc(S.typed)}” isn't in the library yet, so these` : "These";
    st = `${t} are the common ii–Vs in ${keyTxt}: home, ${k.minor ? "the relative major and the iv" : "into ii, to IV and into vi"}. ${$("key").value ? "Paste" : "Choose the tune's key and paste"} its changes to get its exact ii–Vs.`;
    if(S.parsed) st = `No ii–Vs or V–Is found in the ${pdf ? "chart's" : "pasted"} changes (looking for a m7 or m7♭5, or a dominant 7th, moving up a fourth). ` + st;
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
    sec.innerHTML = `<div class="ghead"><h2>${esc(g.name)}</h2><span class="path">${esc(groupPath(g))}</span></div><p class="gdesc">${esc(hornText(g.desc))}</p>`;
    g.lines.forEach((l,i)=>{
      const card = document.createElement("div");
      card.className = "line" + (l.chords.reduce((a,c)=>a+c.beats,0) <= 8 ? " short" : "");
      const label = l.level==="essential" ? "Essential" : "Bebop";
      const lenTag = (opts.len==="both" && g.id!=="chain") ? `<span class="tag len">${l.short ? "Short" : "Long"}</span>` : "";
      const what = `${g.name}, ${l.short ? "short " : ""}${label} line ${i+1}`;
      card.innerHTML = `<div class="lhead"><span class="tag ${l.level}">${label}</span>${lenTag}
        <div class="lctl">
          <div class="seg mini loct" role="group" aria-label="Octave for ${esc(what)}">
            <button type="button" data-o="-1" title="An octave below the original">Low</button><button type="button" data-o="0" title="The original octave">Orig</button><button type="button" data-o="1" title="An octave above the original">High</button>
          </div>
          <label class="chk mini" title="Keep this line when you generate new lines"><input type="checkbox" class="keep"> Keep</label>
          <label class="chk mini" title="Include this line when printing"><input type="checkbox" class="prn"> Print</label>
          <button class="play" type="button" aria-label="Play ${esc(what)}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg><span>Play</span></button>
        </div></div>
        <div class="scorewrap"><div class="score"></div></div><p class="lnote">${lineNote(l)}</p>`;
      sec.appendChild(card);
      const it = {l, card, sec, score:card.querySelector(".score"), btn:card.querySelector(".play"), vo:null};
      items.push(it);
      it.btn.addEventListener("click", ()=> (playing && playing.it===it) ? stop() : play(it));
      wireLine(it);
    });
    main.appendChild(sec);
  });
  renderAll();
  markPrint();

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
  try{ r = await PDF.read(file, name, msg=>{ $("status").textContent = `${name}: ${msg} The first time, this downloads the OCR reader (about 10 MB).`; }); }
  catch(e){ pdfNote = `Couldn't read ${esc(name)}: ${esc(e.message || "unknown error")}.`; }
  if(r){
    if(r.title) $("tune").value = r.title;
    $("key").value = "";
    if(r.count){
      $("changes").value = r.changes; $("chgBox").open = true;
      pdfNote = r.ocr
        ? `This is a scanned chart, so its ${r.count} chord symbols were read with OCR. Check them in the changes box against the chart below: OCR can misread chord symbols. Fix any mistakes and press Generate lines.`
        : `Read ${r.count} chord symbols from the chart; they're in the changes box if you want to check or edit them.`;
    } else {
      $("changes").value = ""; $("chgBox").open = true;
      pdfNote = `Couldn't find any chord symbols in ${esc(name)}, even with OCR. Type its changes into the changes box from the chart below and press Generate lines; until then these lines don't come from the chart.`;
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
  const lines = {};
  Object.keys(lineState).forEach(sl=>{
    const st = lineState[sl];
    if(st.keep || (st.oct!==null && st.oct!==undefined) || st.print===false) lines[sl] = {k:st.keep ? 1 : 0, o:st.oct===undefined ? null : st.oct, p:st.print===false ? 0 : 1, t:st.tid};
  });
  const rec = {id, title:S.title, key:$("key").value, changes:$("changes").value.trim(), seed, opts:Object.assign({}, opts), lines,
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
      <span class="m">${esc(r.keyLabel||"")} · ${n} ii–V${n===1?"":"s"}${r.changes ? " · own changes" : ""}${r.pdf ? " · PDF" : ""}${r.seed ? ` · variation ${r.seed+1}` : ""}${r.opts && (r.opts.e!==1 || r.opts.b!==1) ? ` · ${r.opts.e}+${r.opts.b} lines` : ""}${r.opts && r.opts.len!=="long" ? ` · ${r.opts.len==="both" ? "long + short" : "short"}` : ""}${r.lines && Object.values(r.lines).some(x=>x.k) ? ` · ${Object.values(r.lines).filter(x=>x.k).length} kept` : ""} · ${fmtDate(r.updated)}</span></button>
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

function expandLines(lines){
  if(!lines) return null;
  const out = {};
  Object.keys(lines).forEach(sl=>{ const x = lines[sl]; out[sl] = {keep:!!x.k, oct: x.o===undefined ? null : x.o, print: x.p!==0, tid:x.t}; });
  return out;
}
function openRec(r){
  $("tune").value = r.title;
  $("key").value = r.key || "";
  $("changes").value = r.changes || ""; $("chgBox").open = !!r.changes;
  seed = r.seed || 0;
  pdf = r.pdf || null;
  if(r.opts){ opts = cleanOpts(r.opts); showOpts(); }
  pendingState = expandLines(r.lines);
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
const stOf = it => lineState[it.l.slot] || (lineState[it.l.slot] = {keep:false, oct:null, print:true, tid:""});
function octOf(it){ const o = stOf(it).oct; return o===null || o===undefined ? octShift() : o; }

/* ---------- per-line controls: octave, keep, print ---------- */
function showLineCtl(it){
  const st = stOf(it), o = octOf(it);
  it.card.querySelectorAll(".loct button").forEach(b=>{
    b.setAttribute("aria-pressed", +b.dataset.o===o ? "true" : "false");
    b.classList.toggle("own", st.oct!==null && st.oct!==undefined && +b.dataset.o===o);
  });
  it.card.querySelector(".keep").checked = !!st.keep;
  it.card.querySelector(".prn").checked = st.print!==false;
  it.card.classList.toggle("kept", !!st.keep);
}
function wireLine(it){
  showLineCtl(it);
  it.card.querySelectorAll(".loct button").forEach(b=> b.addEventListener("click", ()=>{
    const v = +b.dataset.o, st = stOf(it);
    /* picking the octave the whole page is on clears the line's own setting */
    st.oct = v===octShift() ? null : v;
    if(playing && playing.it===it) stop();
    renderOne(it); showLineCtl(it); showRange(); saveSoon();
  }));
  it.card.querySelector(".keep").addEventListener("change", e=>{ stOf(it).keep = e.target.checked; showLineCtl(it); saveSoon(); });
  it.card.querySelector(".prn").addEventListener("change", e=>{ stOf(it).print = e.target.checked; markPrint(); saveSoon(); });
}
let saveT;
function saveSoon(){ clearTimeout(saveT); saveT = setTimeout(()=>{ if(sheet) saveCurrent(sheet); }, 400); }

/* ---------- printing ---------- */
function markPrint(){
  let n = 0;
  items.forEach(it=>{ const on = stOf(it).print!==false; it.card.classList.toggle("noprint", !on); if(on) n++; });
  main.querySelectorAll("section.group").forEach(sec=> sec.classList.toggle("noprint", !sec.querySelector(".line:not(.noprint)")));
  $("printBtn").textContent = n===items.length ? `Print all ${n} lines` : `Print ${n} of ${items.length} lines`;
  $("printBtn").disabled = !n;
}
function setAllPrint(on){ items.forEach(it=>{ stOf(it).print = on; showLineCtl(it); }); markPrint(); saveSoon(); }
function fillPrintInfo(){
  const rk = {0:"Concert pitch", 2:"B♭ instruments", 9:"E♭ instruments"}[transpose];
  $("printInfo").textContent = `${rk} · ${clef==="bass" ? "Bass" : "Treble"} clef · ${new Date().toLocaleDateString()} · ${location.href}`;
}
$("selAll").addEventListener("click", ()=> setAllPrint(true));
$("selNone").addEventListener("click", ()=> setAllPrint(false));
$("printBtn").addEventListener("click", ()=>{ stop(); fillPrintInfo(); window.print(); });
window.addEventListener("beforeprint", ()=>{ markPrint(); fillPrintInfo(); });

function renderOne(it){
  if(!window.ABCJS || !sheet) return;
  /* notation is written out in the reading key here (not with abcjs's visualTranspose), so
     the chord symbols on the staff are spelled exactly like the text around them */
  const head = `X:1\nM:4/4\nL:1/8\nK:${hornSigName()}${clef==="bass" ? " clef=bass" : ""}\n`;
  {
    const bars = it.l.chords.reduce((a,c)=>a+c.beats,0)/4;
    const opts = !narrow ? {staffwidth: bars>3 ? 820 : (bars>2 ? 660 : 480)}
      : bars>3 ? {staffwidth:520, wrap:{minSpacing:1, maxSpacing:2.4, preferredMeasuresPerLine:3}}
      : {staffwidth: bars>2 ? 520 : 400};
    const sh = octOf(it);
    const src = head + E.lineAbc(hornLine(it.l), hornSig(), sh);
    it.vo = ABCJS.renderAbc(it.score, src, Object.assign(opts, {
      responsive:"resize", add_classes:true,
      paddingtop:4, paddingbottom:4, paddingleft:0, paddingright:2,
      foregroundColor:"currentColor",
      format:{gchordfont:"IBM Plex Mono 14", annotationfont:"Work Sans 12"}
    }))[0];
    it.events = E.lineEvents(it.l, sh);
  }
}
function renderAll(){
  if(!window.ABCJS || !sheet) return;
  narrow = window.innerWidth < 560;
  items.forEach(it=>{ renderOne(it); showLineCtl(it); });
  showRange();
}
function showRange(){
  let lo = null, hi = null;
  items.forEach(it=>{
    const sh = octOf(it);
    it.l.toks.forEach(t=>{
      if(t.t!=="note") return;
      const n = {step:t.step + 7*sh, alter:t.alter}, m = E.midiOf(n);
      if(!lo || m < lo.m) lo = {m, n};
      if(!hi || m > hi.m) hi = {m, n};
    });
  });
  const mixed = items.some(it=>{ const o = stOf(it).oct; return o!==null && o!==undefined; });
  const nm = x => E.LET[((x.n.step%7)+7)%7] + E.glyph(x.n.alter) + Math.floor(x.n.step/7);
  $("range").textContent = lo ? `${mixed ? "With your octave choices" : octave==="low" ? "In the lower octave" : "In the original octave"} the notes run from ${nm(lo)} to ${nm(hi)} concert.` : "";
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
seg("transpose","t", v=>{ transpose = +v; store.set("transpose", v); if(sheet) generate(false); });
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
  const before = {}; items.forEach(it=> before[it.l.slot] = it.l.note);
  seed++; generate(false);
  /* feedback: flash the button, badge the variation number, and flash each line that changed */
  const b = $("vary"); b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse");
  clearTimeout(b._t); b._t = setTimeout(()=>b.classList.remove("pulse"), 600);
  items.forEach(it=>{ if(it.l.note!==before[it.l.slot]) it.card.classList.add("fresh"); });
  setTimeout(()=> items.forEach(it=>it.card.classList.remove("fresh")), 800);
});
$("tune").addEventListener("change", ()=>{
  /* Switching to another tune: a saved tune brings back its key, changes and PDF; a library
     tune starts clean. Any other title counts as renaming the tune on the page, so its
     changes and PDF stay. */
  const v = $("tune").value, id = norm(v);
  if(!id || (sheet && id===norm(sheet.title))) return;
  tuneChangeP = MY.get(id).then(r=>{
    if(r){ $("key").value = r.key || ""; $("changes").value = r.changes || ""; $("chgBox").open = !!r.changes; pdf = r.pdf || null; pendingState = expandLines(r.lines); }
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
/* bring back the PDF and the per-line settings saved for the tune in the box */
async function restoreSaved(){
  const r = await MY.get(norm($("tune").value || ""));
  pdf = r && r.pdf ? r.pdf : null;
  pendingState = r ? expandLines(r.lines) : null;
  if(r) ctxKey = null;
}
window.addEventListener("popstate", async ()=>{ loadParams(location.search); await restoreSaved(); generate(false); });

(async function init(){
  loadParams(location.search.length>1 ? location.search : (store.get("last") || ""));
  await restoreSaved();
  generate(false);
  if(!(await MY.persistent())) $("mineHint").textContent = "This browser isn't letting the page store data (a private window, perhaps), so the list only lasts until you close the page. Export it to keep a copy.";
})();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll);
let rt;
window.addEventListener("resize", ()=>{ clearTimeout(rt); rt = setTimeout(()=>{ if((window.innerWidth<560)!==narrow){ stop(); renderAll(); } }, 150); });
})();
