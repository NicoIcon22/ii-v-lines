/* ii–V line engine.
 *
 * Line templates are written in ABC (eighth-note unit) against a source key signature and a
 * source target root. The engine parses them into pitches, moves them diatonically to the
 * target ii–V, picks the octave that keeps the line in a comfortable range, and writes ABC
 * back out against the tune's key signature, with accidentals recalculated bar by bar.
 *
 * Chord symbols in a template are placeholders: they are replaced, in order, with the chords
 * listed in the template's `chords` (role, quality, beats), spelled from the target root.
 *
 * In a note, [[X]] is a note or chord name written relative to the template's target root;
 * it is transposed along with the line.
 */
(function(){
const LET = "CDEFGAB", NAT = [0,2,4,5,7,9,11];
const mod = (a,n)=> ((a%n)+n)%n;

/* ---------- pitch names ---------- */
function parseName(s){
  const m = /^([A-G])(bb|##|b|#|♭♭|♯♯|♭|♯|x)?/.exec(s);
  if(!m) return null;
  const a = {"bb":-2,"♭♭":-2,"b":-1,"♭":-1,"#":1,"♯":1,"##":2,"♯♯":2,"x":2}[m[2]||""]||0;
  return {li:LET.indexOf(m[1]), alter:a, rest:s.slice(m[0].length)};
}
const pcOf = n => mod(NAT[n.li]+n.alter,12);
function nameStr(n){ return LET[n.li] + ({"-2":"bb","-1":"b","0":"","1":"#","2":"##"})[n.alter]; }
function glyph(a){ return ({"-2":"𝄫","-1":"♭","0":"","1":"♯","2":"𝄪"})[a]; }
function prettyName(n){ return LET[n.li] + glyph(n.alter); }
function prettySuffix(s){ return s.replace(/b(\d)/g,"♭$1").replace(/#(\d)/g,"♯$1"); }
function prettyChord(c){ const p = parseName(c); return p ? prettyName(p) + prettySuffix(p.rest) : c; }
function interval(from, to){ return {steps: mod(to.li-from.li,7), semis: mod(pcOf(to)-pcOf(from),12)}; }
function moveName(n, steps, semis){
  const li = mod(n.li+steps,7);
  let a = mod(NAT[n.li]+n.alter+semis - NAT[li], 12); if(a>6) a-=12;
  return {li, alter:a};
}
/* respell awkward roots (E#, Fb, double accidentals) */
const PREF = ["C","Db","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
function simplify(n){
  const s = nameStr(n);
  if(Math.abs(n.alter)>1 || ["E#","B#","Fb","Cb"].includes(s)) return parseName(PREF[pcOf(n)]);
  return n;
}

/* ---------- keys ---------- */
const FIFTHS = {C:0,G:1,D:2,A:3,E:4,B:5,"F#":6,"C#":7,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7};
const SHARP_ORDER = [3,0,4,1,5,2,6], FLAT_ORDER = [6,2,5,1,4,0,3];
/* key string "Eb" or "Gm" -> {tonic, minor, major (relative major name)} */
function parseKey(k){
  const minor = /m$/.test(k), t = parseName(minor ? k.slice(0,-1) : k);
  const maj = minor ? moveName(t,2,3) : t;
  return {tonic:t, minor, major:nameStr(maj)};
}
function sigFor(majorName){
  const f = FIFTHS[majorName] ?? 0, s = [0,0,0,0,0,0,0];
  if(f>0) SHARP_ORDER.slice(0,f).forEach(i=>s[i]=1);
  if(f<0) FLAT_ORDER.slice(0,-f).forEach(i=>s[i]=-1);
  return s;
}

/* ---------- ABC subset parse / emit ---------- */
function parseAbc(abc, sig){
  const out = []; let acc = {};
  const re = /"([^"]*)"|([_=^]{0,2})([A-Ga-gz])([,']*)(\d*)|(\|\]|\|)|(\s+)/g; let m;
  while((m = re.exec(abc))){
    if(m[1]!==undefined){ out.push({t:"chord", text:m[1]}); continue; }
    if(m[6]){ out.push({t:"bar", end:m[6]==="|]"}); acc = {}; continue; }
    if(m[7]){ out.push({t:"sp"}); continue; }
    const dur = m[5] ? +m[5] : 1;
    if(m[3]==="z"){ out.push({t:"rest", dur}); continue; }
    const L = m[3], li = LET.indexOf(L.toUpperCase());
    let oct = L===L.toUpperCase() ? 4 : 5;
    for(const c of m[4]) oct += c==="'" ? 1 : -1;
    const step = li + 7*oct;
    let alter;
    if(m[2]){ alter = {"_":-1,"__":-2,"=":0,"^":1,"^^":2}[m[2]]; acc[step] = alter; }
    else alter = (step in acc) ? acc[step] : sig[li];
    out.push({t:"note", step, alter, dur});
  }
  return out;
}
const midiOf = n => 12*(Math.floor(n.step/7)+1) + NAT[mod(n.step,7)] + n.alter;
function noteAbc(step){
  const li = mod(step,7), oct = Math.floor(step/7);
  let s = LET[li];
  if(oct>=5) s = s.toLowerCase() + "'".repeat(oct-5);
  else s = s + ",".repeat(4-oct);
  return s;
}
function emitAbc(tokens, sig, chordNames){
  let s = "", acc = {}, ci = 0;
  tokens.forEach(t=>{
    if(t.t==="chord") s += '"' + (chordNames[ci++]||"") + '"';
    else if(t.t==="bar"){ s += t.end ? "|]" : "|"; acc = {}; }
    else if(t.t==="sp") s += " ";
    else if(t.t==="rest") s += "z" + (t.dur>1 ? t.dur : "");
    else {
      const li = mod(t.step,7), cur = (t.step in acc) ? acc[t.step] : sig[li];
      let a = "";
      if(t.alter!==cur){ a = {"-2":"__","-1":"_","0":"=","1":"^","2":"^^"}[t.alter]; acc[t.step] = t.alter; }
      s += a + noteAbc(t.step) + (t.dur>1 ? t.dur : "");
    }
  });
  return s;
}

/* ---------- templates ----------
 * role offsets from the target root: [letter steps, semitones] */
const ROLE = {I:[0,0], ii:[1,2], V:[4,7], iii:[2,4], VI:[5,9]};
const MAJ = [["ii","m7",4],["V","7",4],["I","maj7",4]];
const MAJ_B9 = [["ii","m7",4],["V","7b9",4],["I","maj7",4]];
const MIN = [["ii","m7b5",4],["V","7b9",4],["I","m7",4]];
const FAST_MAJ = [["ii","m7",2],["V","7",2],["I","maj7",4]];
const FAST_MAJ_B9 = [["ii","m7",2],["V","7b9",2],["I","maj7",4]];
const FAST_MIN = [["ii","m7b5",2],["V","7b9",2],["I","m7",4]];

const T = {
  major:{
    essential:[
      {key:"Eb", root:"Eb", chords:MAJ,
       abc:'"ii"FAce gfec|"V"=BAFD _B,DFA|"I"G4 z4|]',
       note:"<b>[[Fm9]] arpeggio</b> up and back down. [[B]] (the ♭9) slides into a [[Bb7]] arpeggio, and <b>[[Ab]] → [[G]]</b> is the guide-tone resolution into [[Eb]]."},
      {key:"Eb", root:"Ab", chords:MAJ,
       abc:'"ii"FAB_d fe_dB|"V"GEGB _dfe_d|"I"c4 z4|]',
       note:"[[Bbm7]] arpeggio with the 11th, then [[Eb7]] with its 9th ([[F]]). <b>[[Db]] → [[C]]</b> is the guide tone from the 7th of [[Eb7]] to the 3rd of [[Abmaj7]]."},
      {key:"C", root:"C", chords:MAJ,
       abc:'"ii"dcAF EFAc|"V"Bdfe dBGF|"I"E4 z4|]',
       note:"[[Dm9]] down from the root and back up from the 9th. [[C]] → [[B]] links the 7th of [[Dm7]] to the 3rd of [[G7]], and <b>[[F]] → [[E]]</b> does the same into [[Cmaj7]]."}
    ],
    bebop:[
      {key:"Eb", root:"Eb", chords:MAJ_B9,
       abc:'"ii"zceg fedc|"V"=Bdfa g_gfd|"I"e2B2 d4|]',
       note:"Starts on the and of 1. Over [[Bb7b9]] it outlines a <b>[[B°7]]</b> arpeggio (the ♭9 sound), then runs [[G]]–[[Gb]]–[[F]]–[[D]] chromatically and steps up to [[Eb]]."},
      {key:"Eb", root:"Ab", chords:MAJ_B9,
       abc:'"ii"fe_dc BAGF|"V"=EGB_d =e_dB=B|"I"c2e2 g4|]',
       note:"[[Bb]] dorian down from [[F]], an <b>[[E°7]]</b> arpeggio for [[Eb7b9]], then [[Bb]]–[[B]] chromatically into [[C]]."},
      {key:"C", root:"C", chords:MAJ_B9,
       abc:'"ii"zAce gfed|"V"c=Bdf _agfd|"I"e2c2 G4|]',
       note:"Up the top of [[Dm9]] and down the scale, then a [[C]] → [[B]] approach into a <b>[[B°7]]</b> arpeggio (the ♭9 sound), and [[D]] steps up to <b>[[E]], the 3rd of [[Cmaj7]]</b>."}
    ]
  },
  minor:{
    essential:[
      {key:"Eb", root:"F", chords:MIN,
       abc:'"ii"GB_df e_dBG|"V"=EGB_d cBAG|"I"A4 z4|]',
       note:"[[Gm7b5]] arpeggio, then <b>[[E]]</b>, the 3rd of [[C7]]. [[C]]–[[Bb]]–[[Ab]]–[[G]] is the phrygian-dominant sound, and [[G]] rises to [[Ab]], the 3rd of [[Fm]]."},
      {key:"Eb", root:"C", chords:MIN,
       abc:'"ii"FAcf edcA|"V"=Bdfa gfd=B|"I"c4 z4|]',
       note:"[[Dm7b5]] arpeggio, then a [[B°7]] arpeggio over [[G7b9]]. The <b>leading tone [[B]]</b> resolves to [[C]]."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"dc_AF DF_Ac|"V"=BG_AB df_ed|"I"c4 z4|]',
       note:"[[Dm7b5]] down and back up. Over [[G7b9]] the line circles the 3rd ([[B]]–[[G]]–[[Ab]]–[[B]]), climbs to the 7th and lands on <b>[[C]]</b> through the ♭13 ([[Eb]]) and the 5th ([[D]])."}
    ],
    bebop:[
      {key:"Eb", root:"F", chords:MIN,
       abc:'"ii"z_dfa gf_dB|"V"AG=EG B_dcB|"I"A2c2 F4|]',
       note:"A [[Bbm7]] shape over [[Gm7b5]] gives the half-diminished color. The [[Ab]] on beat 1 of [[C7b9]] is the <b>♭13</b>, and the line lands on [[Ab]] again in [[Fm]]."},
      {key:"Eb", root:"C", chords:MIN,
       abc:'"ii"zdfa gfed|"V"c=Bdf agfd|"I"e4 z4|]',
       note:"Locrian run from [[D]] back down to [[D]], a [[C]]–[[B]] approach into the ♭9 arpeggio, and [[D]] steps up to <b>[[Eb]], the 3rd of [[Cm]]</b>."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"zF_Ac _edc_A|"V"G=Bdf _agfd|"I"_e2c2 G4|]',
       note:"Starts on the and of 1 with [[Dm7b5]] and its ♭9 ([[Eb]]), runs up [[G7b9]] to the ♭9 ([[Ab]]) and back down, and [[D]] rises to <b>[[Eb]], the 3rd of [[Cm]]</b>."}
    ]
  },
  fastMajor:{
    essential:[
      {key:"Eb", root:"Eb", chords:FAST_MAJ,
       abc:'"ii"A2e2 "V"d2A2|"I"G4 z4|]',
       note:"Guide tones only: <b>[[Ab]] and [[Eb]]</b> (3rd and 7th of [[Fm7]]), <b>[[D]] and [[Ab]]</b> (3rd and 7th of [[Bb7]]), resolving to [[G]]."},
      {key:"C", root:"C", chords:FAST_MAJ,
       abc:'"ii"FAce "V"dBGF|"I"E4 z4|]',
       note:"[[Dm9]] up from the 3rd, [[G7]] down from the 5th, and the 7th ([[F]]) falls to <b>[[E]]</b>."}
    ],
    bebop:[
      {key:"Eb", root:"Eb", chords:FAST_MAJ_B9,
       abc:'"ii"fedc "V"=Bdfa|"I"g4 z4|]',
       note:"The classic shape: [[F]]–[[Eb]]–[[D]]–[[C]] down, <b>[[B°7]]</b> up, and [[Ab]] falls to [[G]] on the downbeat."},
      {key:"C", root:"C", chords:FAST_MAJ_B9,
       abc:'"ii"fedc "V"=B_AGF|"I"E4 z4|]',
       note:"A straight run down: [[Dm7]] from [[F]], then [[B]]–[[Ab]]–[[G]]–[[F]] over [[G7b9]] (3rd, ♭9, root, 7th), and [[F]] resolves to <b>[[E]]</b>."}
    ]
  },
  fastMinor:{
    essential:[
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"F2c2 "V"=B2F2|"I"_E4 z4|]',
       note:"Guide tones only: <b>[[F]] and [[C]]</b> (3rd and 7th of [[Dm7b5]]), <b>[[B]] and [[F]]</b> (3rd and 7th of [[G7b9]]), resolving to [[Eb]]."}
    ],
    bebop:[
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"dc_AF "V"=Bdf_a|"I"g4 z4|]',
       note:"Down [[Dm7b5]] from the root, up a <b>[[B°7]]</b> arpeggio for the ♭9 sound, and [[Ab]] falls to [[G]], the 5th of [[Cm]]."}
    ]
  },
  chain:{
    bebop:[
      {key:"Eb", root:"Eb", chords:[["iii","m7b5",4],["VI","7b9",4],["ii","m7",4],["V","7",4],["I","maj7",4]],
       abc:'"a"zGB_d fagf|"b"=e_dBG =EGB_d|"c"cBAG FAce|"d"dfag _gfdA|"e"G2B2 d4|]',
       note:"Each bar ends a half or whole step from a chord tone of the next: [[F]] → [[E]], [[Db]] → [[C]], [[Eb]] → [[D]], [[Ab]] → [[G]]."}
    ]
  }
};

/* ---------- realize a template for a target ---------- */
const LO = 55, HI = 81; /* comfortable range for the original register: G3 to A5 */
const cache = new WeakMap();
function parsedTemplate(tp){
  if(!cache.has(tp)){
    const k = parseKey(tp.key);
    const toks = parseAbc(tp.abc, sigFor(k.major));
    const notes = toks.filter(t=>t.t==="note");
    const ms = notes.map(midiOf);
    cache.set(tp, {toks, lo:Math.min(...ms), hi:Math.max(...ms), root:parseName(tp.root)});
  }
  return cache.get(tp);
}

/* target: {li, alter}; sig: key signature array of the tune; returns a line object */
function realize(tp, target, sig){
  const P = parsedTemplate(tp);
  const iv = interval(P.root, target);
  let steps = iv.steps, semis = iv.semis;
  /* go up or down to the target, whichever keeps the line inside LO..HI;
     if both fit (or neither), take the shorter move */
  const over = d => Math.max(0, LO-(P.lo+d)) + Math.max(0, (P.hi+d)-HI);
  const up = over(semis), down = over(semis-12);
  if(down < up || (down===up && 12-semis < semis)){ steps -= 7; semis -= 12; }
  const toks = P.toks.map(t=>{
    if(t.t!=="note") return t;
    const midi = midiOf(t) + semis, step = t.step + steps;
    const nat = 12*(Math.floor(step/7)+1) + NAT[mod(step,7)];
    return {t:"note", step, alter: midi-nat, dur:t.dur};
  });
  const chords = tp.chords.map(([role,q,beats])=>{
    const r = moveName(target, ROLE[role][0], ROLE[role][1]);
    return {name: nameStr(r)+q, beats};
  });
  const note = tp.note.replace(/\[\[([^\]]+)\]\]/g, (m,x)=>{
    const p = parseName(x); if(!p) return x;
    const t = moveName(p, iv.steps, iv.semis);
    if(p.rest) return prettyName(t) + prettySuffix(p.rest);
    /* single note: show a natural sign when the key signature would otherwise alter it */
    return LET[t.li] + (t.alter===0 && sig[t.li]!==0 ? "♮" : glyph(t.alter));
  }).replace(/\b(a|an|A|An) ((?:<b>)?)([A-G])(?![a-ln-z])/g, (m,art,b,l)=>{
    /* a/an before a note or chord name: "an E♭7", "a B°7" */
    const an = "AEF".includes(l), cap = art[0]==="A";
    return (an ? (cap?"An":"an") : (cap?"A":"a")) + " " + b + l;
  });
  return {toks, chords, note};
}

/* ABC body for a realized line at a given octave offset (0 or -1) */
function lineAbc(line, sig, octave){
  const toks = octave ? line.toks.map(t=> t.t==="note" ? Object.assign({}, t, {step:t.step+7*octave}) : t) : line.toks;
  return emitAbc(toks, sig, line.chords.map(c=>c.name));
}
/* note events in beats for playback */
function lineEvents(line, octave){
  const ev = []; let t = 0;
  line.toks.forEach(k=>{
    if(k.t==="note"){ ev.push({pitch: midiOf(k)+12*(octave||0), start:t/2, dur:k.dur/2}); t += k.dur; }
    else if(k.t==="rest") t += k.dur;
  });
  return ev;
}

/* ---------- harmony for playback ---------- */
const VOICINGS = {"maj7":[4,7,11,14], "m7":[3,7,10,14], "7":[10,14,16,21], "7b9":[10,13,16,21], "m7b5":[3,6,10,12]};
function voicing(chord){
  const p = parseName(chord), pc = pcOf(p), iv = VOICINGS[p.rest] || VOICINGS["7"];
  const low = 50 + mod(pc + iv[0] - 50, 12);
  const notes = iv.map(i => low - iv[0] + i);
  const root = 34 + mod(pc - 34, 12);
  let fifth = root + (p.rest==="m7b5" ? 6 : 7); if(fifth>45) fifth -= 12;
  return {notes, root, fifth};
}

/* ---------- chord-change parser ---------- */
function chordType(q){
  if(/(ø|m7b5|m7♭5|-7b5|-7♭5|mi7b5|min7b5|m7\(b5\)|h7)/.test(q)) return "hd";
  if(/^(°|o|dim)/.test(q)) return "dim";
  if(/^(m(?!a)|-|mi(?!a)|min)/.test(q)) return "min";
  if(/^(7|9|11|13|alt|\+7|aug7|7sus|sus)/.test(q) || (/7/.test(q) && !/(maj|M|Δ|ma)/.test(q))) return "dom";
  return "maj";
}
function parseChanges(text){
  const toks = text.replace(/[()\[\]%]/g," ").split(/[\s|,;:]+/).filter(Boolean);
  const chords = [];
  toks.forEach(tok=>{
    const m = /^([A-G](?:b|#|♭|♯)?)([^/]*)(\/.*)?$/.exec(tok);
    if(!m) return;
    const root = parseName(m[1].replace("♭","b").replace("♯","#"));
    const last = chords[chords.length-1];
    const c = {root, type: chordType(m[2]), q:m[2]};
    if(last && pcOf(last.root)===pcOf(root) && last.type===c.type) return; /* repeated chord */
    chords.push(c);
  });
  const targets = [];
  for(let i=0;i<chords.length-1;i++){
    const a = chords[i], b = chords[i+1];
    if((a.type==="min"||a.type==="hd") && b.type==="dom" && mod(pcOf(b.root)-pcOf(a.root),12)===5){
      const tgt = moveName(b.root, 3, 5), nx = chords[i+2];
      const minor = (nx && pcOf(nx.root)===pcOf(tgt)) ? (nx.type==="min"||nx.type==="hd") : a.type==="hd";
      const key = pcOf(tgt)+(minor?"m":"");
      if(!targets.some(t=>t.id===key)) targets.push({id:key, root:simplify(tgt), minor});
    }
  }
  /* home key: the last chord if it sounds like a tonic (maj7, 6, m6, m(maj7)...), else the
     first chord if it does, else the ii–V target that comes up most often */
  const tonicLike = c => c.type==="maj" || (c.type==="min" && /^(m|-|mi|min)(6|69|6\/9|\(?maj7\)?|\(?ma7\)?|Δ7?|M7)?$/.test(c.q));
  let home = null;
  const last = chords[chords.length-1], first = chords[0];
  if(last && tonicLike(last)) home = {root:last.root, minor:last.type==="min"};
  else if(first && tonicLike(first)) home = {root:first.root, minor:first.type==="min"};
  else if(targets.length){
    const n = {}; targets.forEach(t=>n[t.id]=0);
    for(let i=0;i<chords.length-1;i++){
      const a = chords[i], b = chords[i+1];
      if((a.type==="min"||a.type==="hd") && b.type==="dom" && mod(pcOf(b.root)-pcOf(a.root),12)===5){
        const tg = moveName(b.root,3,5), nx = chords[i+2];
        const minor = (nx && pcOf(nx.root)===pcOf(tg)) ? (nx.type==="min"||nx.type==="hd") : a.type==="hd";
        n[pcOf(tg)+(minor?"m":"")]++;
      }
    }
    const best = targets.slice().sort((x,y)=> n[y.id]-n[x.id])[0];
    home = {root:best.root, minor:best.minor};
  }
  return {chords, targets, home: home ? {root:simplify(home.root), minor:home.minor} : null};
}

window.IIV = {T, parseName, nameStr, prettyName, prettyChord, pcOf, moveName, interval, simplify,
  parseKey, sigFor, realize, lineAbc, lineEvents, voicing, parseChanges, midiOf, glyph, LET};
})();
