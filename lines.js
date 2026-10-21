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
 * it is transposed along with the line. [[X|I]] marks a note of the I chord: when the tune's
 * I chord differs from the template's (see realize), it moves with the I bar.
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
       note:"<b>[[Fm9]] arpeggio</b> up and back down. [[B]] (the ♭9) slides into a [[Bb7]] arpeggio, and <b>[[Ab]] → [[G|I]]</b> is the guide-tone resolution into [[Eb]]."},
      {key:"Eb", root:"Ab", chords:MAJ,
       abc:'"ii"FAB_d fe_dB|"V"GEGB _dfe_d|"I"c4 z4|]',
       note:"[[Bbm7]] arpeggio with the 11th, then [[Eb7]] with its 9th ([[F]]). <b>[[Db]] → [[C|I]]</b> is the guide tone from the 7th of [[Eb7]] to the 3rd of [[Abmaj7]]."},
      {key:"C", root:"C", chords:MAJ,
       abc:'"ii"dcAF EFAc|"V"Bdfe dBGF|"I"E4 z4|]',
       note:"[[Dm9]] down from the root and back up from the 9th. [[C]] → [[B]] links the 7th of [[Dm7]] to the 3rd of [[G7]], and <b>[[F]] → [[E|I]]</b> does the same into [[Cmaj7]]."},
      {key:"C", root:"C", chords:MAJ,
       abc:'"ii"c3A F2E2|"V"B3d f2d2|"I"e4 z4|]',
       note:"Dotted-quarter rhythm on the chord tones: [[C]]–[[A]]–[[F]]–[[E]] over [[Dm7]], then [[B]]–[[D]]–[[F]] over [[G7]], and [[D]] steps up to <b>[[E|I]], the 3rd of [[Cmaj7]]</b>."}
    ],
    bebop:[
      {key:"Eb", root:"Eb", chords:MAJ_B9,
       abc:'"ii"zceg fedc|"V"=Bdfa g_gfd|"I"e2B2 d4|]',
       note:"Starts on the and of 1. Over [[Bb7b9]] it outlines a <b>[[B°7]]</b> arpeggio (the ♭9 sound), then runs [[G]]–[[Gb]]–[[F]]–[[D]] chromatically and steps up to [[Eb]]."},
      {key:"Eb", root:"Ab", chords:MAJ_B9,
       abc:'"ii"fe_dc BAGF|"V"=EGB_d =e_dB=B|"I"c2e2 g4|]',
       note:"[[Bb]] dorian down from [[F]], an <b>[[E°7]]</b> arpeggio for [[Eb7b9]], then [[Bb]]–[[B]] chromatically into [[C|I]]."},
      {key:"C", root:"C", chords:MAJ_B9,
       abc:'"ii"zAce gfed|"V"c=Bdf _agfd|"I"e2c2 G4|]',
       note:"Up the top of [[Dm9]] and down the scale, then a [[C]] → [[B]] approach into a <b>[[B°7]]</b> arpeggio (the ♭9 sound), and [[D]] steps up to <b>[[E|I]], the 3rd of [[Cmaj7]]</b>."},
      {key:"C", root:"C", chords:MAJ_B9,
       abc:'"ii"AGFE ^DEFA|"V"_AGF_E D_DC=B|"I"c2G2 E4|]',
       note:"Down [[Dm7]] from the 5th with a chromatic lower neighbor ([[D#]]) and back up to [[A]], which slides a half step to <b>[[Ab]]</b>, the ♭9. A chromatic descent through the altered tones lands on [[B]] → <b>[[C]]</b>."}
    ]
  },
  minor:{
    essential:[
      {key:"Eb", root:"F", chords:MIN,
       abc:'"ii"GB_df e_dBG|"V"=EGB_d cBAG|"I"A4 z4|]',
       note:"[[Gm7b5]] arpeggio, then <b>[[E]]</b>, the 3rd of [[C7]]. [[C]]–[[Bb]]–[[Ab]]–[[G]] is the phrygian-dominant sound, and [[G]] rises to [[Ab|I]], the 3rd of [[Fm]]."},
      {key:"Eb", root:"C", chords:MIN,
       abc:'"ii"FAcf edcA|"V"=Bdfa gfd=B|"I"c4 z4|]',
       note:"[[Dm7b5]] arpeggio, then a [[B°7]] arpeggio over [[G7b9]]. The <b>leading tone [[B]]</b> resolves to [[C]]."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"dc_AF DF_Ac|"V"=BG_AB df_ed|"I"c4 z4|]',
       note:"[[Dm7b5]] down and back up. Over [[G7b9]] the line circles the 3rd ([[B]]–[[G]]–[[Ab]]–[[B]]), climbs to the 7th and lands on <b>[[C]]</b> through the ♭13 ([[Eb]]) and the 5th ([[D]])."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"c3_A F2D2|"V"=B,3D F2_A2|"I"G4 z4|]',
       note:"Dotted-quarter arpeggios: [[Dm7b5]] down from the 7th, [[G7b9]] up from the 3rd to the ♭9 ([[Ab]]), and [[Ab]] falls to <b>[[G]]</b>, the 5th of [[Cm]]."}
    ],
    bebop:[
      {key:"Eb", root:"F", chords:MIN,
       abc:'"ii"z_dfa gf_dB|"V"AG=EG B_dcB|"I"A2c2 F4|]',
       note:"A [[Bbm7]] shape over [[Gm7b5]] gives the half-diminished color. The [[Ab]] on beat 1 of [[C7b9]] is the <b>♭13</b>, and the line lands on [[Ab|I]] again in [[Fm]]."},
      {key:"Eb", root:"C", chords:MIN,
       abc:'"ii"zdfa gfed|"V"c=Bdf agfd|"I"e4 z4|]',
       note:"Locrian run from [[D]] back down to [[D]], a [[C]]–[[B]] approach into the ♭9 arpeggio, and [[D]] steps up to <b>[[Eb|I]], the 3rd of [[Cm]]</b>."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"zF_Ac _edc_A|"V"G=Bdf _agfd|"I"_e2c2 G4|]',
       note:"Starts on the and of 1 with [[Dm7b5]] and its ♭9 ([[Eb]]), runs up [[G7b9]] to the ♭9 ([[Ab]]) and back down, and [[D]] rises to <b>[[Eb|I]], the 3rd of [[Cm]]</b>."},
      {key:"C", root:"C", chords:MIN,
       abc:'"ii"_ecdf _agfd|"V"_dc=Bd f_agf|"I"_e2G2 c4|]',
       note:"An [[Eb]]–[[C]] enclosure of [[D]] opens the [[Dm7b5]] arpeggio. Over [[G7b9]], [[Db]]–[[C]] lead chromatically into [[B]], the line climbs to the ♭9 ([[Ab]]), and [[F]] resolves to <b>[[Eb|I]], the 3rd of [[Cm]]</b>."}
    ]
  },
  fastMajor:{
    essential:[
      {key:"Eb", root:"Eb", chords:FAST_MAJ,
       abc:'"ii"A2e2 "V"d2A2|"I"G4 z4|]',
       note:"Guide tones only: <b>[[Ab]] and [[Eb]]</b> (3rd and 7th of [[Fm7]]), <b>[[D]] and [[Ab]]</b> (3rd and 7th of [[Bb7]]), resolving to [[G|I]]."},
      {key:"C", root:"C", chords:FAST_MAJ,
       abc:'"ii"FAce "V"dBGF|"I"E4 z4|]',
       note:"[[Dm9]] up from the 3rd, [[G7]] down from the 5th, and the 7th ([[F]]) falls to <b>[[E|I]]</b>."},
      {key:"C", root:"C", chords:FAST_MAJ,
       abc:'"ii"cAFD "V"=B,DFA|"I"G4 z4|]',
       note:"[[Dm7]] down from the 7th, [[G9]] up from the 3rd, and [[A]] falls to <b>[[G]]</b>, the 5th of [[Cmaj7]]."}
    ],
    bebop:[
      {key:"Eb", root:"Eb", chords:FAST_MAJ_B9,
       abc:'"ii"fedc "V"=Bdfa|"I"g4 z4|]',
       note:"The classic shape: [[F]]–[[Eb]]–[[D]]–[[C]] down, <b>[[B°7]]</b> up, and [[Ab]] falls to [[G|I]] on the downbeat."},
      {key:"C", root:"C", chords:FAST_MAJ_B9,
       abc:'"ii"fedc "V"=B_AGF|"I"E4 z4|]',
       note:"A straight run down: [[Dm7]] from [[F]], then [[B]]–[[Ab]]–[[G]]–[[F]] over [[G7b9]] (3rd, ♭9, root, 7th), and [[F]] resolves to <b>[[E|I]]</b>."},
      {key:"C", root:"C", chords:FAST_MAJ_B9,
       abc:'"ii"zDFA "V"_A^FG=B|"I"c4 z4|]',
       note:"Up [[Dm7]] from the and of 1, then an [[Ab]]–[[F#]] enclosure of [[G]], and the 3rd ([[B]]) leads into <b>[[C]]</b>."}
    ]
  },
  fastMinor:{
    essential:[
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"F2c2 "V"=B2F2|"I"_E4 z4|]',
       note:"Guide tones only: <b>[[F]] and [[C]]</b> (3rd and 7th of [[Dm7b5]]), <b>[[B]] and [[F]]</b> (3rd and 7th of [[G7b9]]), resolving to [[Eb|I]]."},
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"DF_Ac "V"=Bd_af|"I"_e4 z4|]',
       note:"[[Dm7b5]] up from the root, then [[G7b9]] from the 3rd with a leap to the ♭9 ([[Ab]]), and [[F]] resolves to <b>[[Eb|I]]</b>, the 3rd of [[Cm]]."},
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"c2_A2 "V"G2=B2|"I"c4 z4|]',
       note:"Quarter notes: [[C]] and [[Ab]] (7th and ♭5 of [[Dm7b5]]), [[G]] and [[B]] (root and 3rd of [[G7b9]]), and the leading tone resolves to <b>[[C]]</b>."}
    ],
    bebop:[
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"dc_AF "V"=Bdf_a|"I"g4 z4|]',
       note:"Down [[Dm7b5]] from the root, up a <b>[[B°7]]</b> arpeggio for the ♭9 sound, and [[Ab]] falls to [[G]], the 5th of [[Cm]]."},
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"_edc_A "V"G_A=Bd|"I"c4 z4|]',
       note:"Locrian run down from the ♭9 ([[Eb]]) of [[Dm7b5]], then [[G]]–[[Ab]]–[[B]]–[[D]] up the [[G7b9]], and [[D]] falls to <b>[[C]]</b>."},
      {key:"C", root:"C", chords:FAST_MIN,
       abc:'"ii"zF_Ac "V"=B_AGF|"I"_E4 z4|]',
       note:"[[Dm7b5]] from the and of 1, then [[B]]–[[Ab]]–[[G]]–[[F]] down [[G7b9]] (3rd, ♭9, root, 7th), and [[F]] resolves to <b>[[Eb|I]]</b>, the 3rd of [[Cm]]."}
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

/* The I chord a template resolves to can be swapped for the tune's own: iq is "maj7", "m7"
   or "7". Notes in the I bar (and note names marked [[X|I]] in the text) move by a half step
   where the chord differs: the 3rd (major ↔ minor) and the 7th (major 7th ↔ ♭7). */
const IQ_CLASS = q => /^m(?!aj)/.test(q) ? "min" : /^(7|9|13)/.test(q) ? "dom" : "maj";
const I_SHIFT = {
  "maj>min": {4:-1, 11:-1}, "maj>dom": {11:-1},
  "min>maj": {3:1, 10:1},   "min>dom": {3:1}
};
function iShift(tp, iq){
  if(!iq) return null;
  const I = tp.chords.find(c=>c[0]==="I"); if(!I) return null;
  const from = IQ_CLASS(I[1]), to = IQ_CLASS(iq);
  return from===to ? null : (I_SHIFT[from+">"+to] || null);
}

/* target: {li, alter}; sig: key signature array of the tune; iq: the tune's I chord quality
   (optional; default is the template's own); returns a line object */
function realize(tp, target, sig, iq){
  const P = parsedTemplate(tp);
  const iv = interval(P.root, target);
  let steps = iv.steps, semis = iv.semis;
  /* go up or down to the target, whichever keeps the line inside LO..HI;
     if both fit (or neither), take the shorter move */
  const over = d => Math.max(0, LO-(P.lo+d)) + Math.max(0, (P.hi+d)-HI);
  const up = over(semis), down = over(semis-12);
  if(down < up || (down===up && 12-semis < semis)){ steps -= 7; semis -= 12; }
  const shift = iShift(tp, iq), tpc = pcOf(target);
  const iAt = tp.chords.findIndex(c=>c[0]==="I");
  let ci = -1;
  const toks = P.toks.map(t=>{
    if(t.t==="chord") ci++;
    if(t.t!=="note") return t;
    let midi = midiOf(t) + semis; const step = t.step + steps;
    if(shift && ci===iAt) midi += shift[mod(midi - tpc, 12)] || 0;
    const nat = 12*(Math.floor(step/7)+1) + NAT[mod(step,7)];
    return {t:"note", step, alter: midi-nat, dur:t.dur};
  });
  const chords = tp.chords.map(([role,q,beats])=>{
    const r = moveName(target, ROLE[role][0], ROLE[role][1]);
    return {name: nameStr(r) + (role==="I" && iq ? iq : q), beats};
  });
  const note = tp.note.replace(/\[\[([^\]|]+)(\|I)?\]\]/g, (m,x,inI)=>{
    const p = parseName(x); if(!p) return x;
    let t = moveName(p, iv.steps, iv.semis);
    if(p.rest){
      /* the I chord itself: named as the tune has it */
      if(shift && pcOf(p)===pcOf(P.root)) return prettyName(t) + prettySuffix(iq);
      return prettyName(t) + prettySuffix(p.rest);
    }
    if(inI && shift){ const d = shift[mod(pcOf(t) - tpc, 12)] || 0; if(d) t = {li:t.li, alter:t.alter + d}; }
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
  /* chords in order, with the bar each one starts in when the text has bar lines */
  const hasBars = /\|/.test(text);
  const chords = [];
  let bar = 0;
  text.replace(/[()\[\]%]/g," ").split(/\|/).forEach(seg=>{
    const toks = seg.split(/[\s,;:]+/).filter(Boolean);
    let counted = false;
    toks.forEach(tok=>{
      const m = /^([A-G](?:b|#|♭|♯)?)([^/]*)(\/.*)?$/.exec(tok);
      if(!m) return;
      if(!counted){ bar++; counted = true; }
      const root = parseName(m[1].replace("♭","b").replace("♯","#"));
      const last = chords[chords.length-1];
      const c = {root, type: chordType(m[2]), q:m[2], bar: hasBars ? bar : 0};
      if(last && pcOf(last.root)===pcOf(root) && last.type===c.type) return; /* repeated chord */
      chords.push(c);
    });
  });
  /* every ii–V in the changes: a m7 or m7♭5 followed by a dominant 7th a fourth up, major or
     minor, wherever it goes. When the next chord is the I (a fifth below the V) it is a
     ii–V–I, and the I's quality (major, minor or dominant) comes from the tune; when it isn't,
     the ii–V doesn't resolve, and the I it points to is taken from the ii (m7 → major,
     m7♭5 → minor). A V–I with no ii, or chords moving any other way, gets nothing. */
  const IQ = {maj:"maj7", min:"m7", hd:"m7", dom:"7"};
  const iiVs = [];
  for(let i=0;i<chords.length-1;i++){
    const a = chords[i], b = chords[i+1];
    if(!((a.type==="min"||a.type==="hd") && b.type==="dom" && mod(pcOf(b.root)-pcOf(a.root),12)===5)) continue;
    const tgt = moveName(b.root, 3, 5), nx = chords[i+2];
    const resolved = !!(nx && pcOf(nx.root)===pcOf(tgt) && IQ[nx.type]);
    const minor = a.type==="hd";
    iiVs.push({at:i, root:simplify(tgt), minor, resolved,
      iq: resolved ? IQ[nx.type] : (minor ? "m7" : "maj7"),
      bars: a.bar ? [a.bar, (resolved ? nx : b).bar] : null});
  }
  /* one target per ii–V and resolution: the same ii–V resolving to different kinds of I chord
     gets one section per kind; where it also turns up without resolving, those bars join the
     first of them; a ii–V that never resolves gets its own section */
  const targets = [], byKey = {};
  const idOf = (pc, minor, iq) => pc + (minor ? "m" : "") + (iq===(minor ? "m7" : "maj7") ? "" : "-" + iq);
  iiVs.filter(t=>t.resolved).forEach(t=>{
    const id = idOf(pcOf(t.root), t.minor, t.iq);
    let tg = targets.find(x=>x.id===id);
    if(!tg){ tg = {id, root:t.root, minor:t.minor, iq:t.iq, resolved:true, occ:[]}; targets.push(tg); }
    tg.occ.push(t);
  });
  iiVs.filter(t=>!t.resolved).forEach(t=>{
    const k = pcOf(t.root) + (t.minor ? "m" : "");
    let tg = targets.find(x=> pcOf(x.root)+(x.minor ? "m" : "")===k);
    if(!tg){ tg = {id:idOf(pcOf(t.root), t.minor, t.iq), root:t.root, minor:t.minor, iq:t.iq, resolved:false, occ:[]}; targets.push(tg); }
    tg.occ.push(t);
  });
  /* back in the order the ii–Vs first come up in the tune */
  targets.sort((x,y)=> Math.min(...x.occ.map(o=>o.at)) - Math.min(...y.occ.map(o=>o.at)));
  targets.forEach(t=>{
    t.open = t.occ.some(o=>!o.resolved);
    t.bars = t.occ.filter(o=>o.bars).map(o=>({from:o.bars[0], to:o.bars[1], resolved:o.resolved}));
  });
  /* the chain: a ii–V into a m7 chord that is itself the ii of the next ii–V (iii VI ii V) */
  const chain = [];
  iiVs.forEach(t=>{
    const n = iiVs.find(x=>x.at===t.at+2);
    if(n && t.minor && !n.minor && n.iq==="maj7" && chords[t.at+2].type==="min") chain.push(pcOf(n.root));
  });
  /* home key: the last chord if it sounds like a tonic (maj7, 6, m6, m(maj7)...), else the
     first chord if it does, else the ii–V target that comes up most often */
  const tonicLike = c => c.type==="maj" || (c.type==="min" && /^(m|-|mi|min)(6|69|6\/9|\(?maj7\)?|\(?ma7\)?|Maj7|Δ7?|M7)?$/.test(c.q));
  let home = null;
  const last = chords[chords.length-1], first = chords[0];
  if(last && tonicLike(last)) home = {root:last.root, minor:last.type==="min"};
  else if(first && tonicLike(first)) home = {root:first.root, minor:first.type==="min"};
  else if(targets.length){
    const best = targets.slice().sort((x,y)=> y.occ.length-x.occ.length)[0];
    home = {root:best.root, minor:best.iq==="m7"};
  }
  return {chords, targets, chain, hasBars, home: home ? {root:simplify(home.root), minor:home.minor} : null};
}
/* chord names in a changes text moved by an interval ({steps, semis}); bar lines and
   spacing stay as they are */
function transposeChanges(text, iv){
  return text.replace(/(^|[\s|\/(,])([A-G])(bb|##|b|#|♭|♯)?/g, (m, pre, L, acc)=>{
    const n = simplify(moveName(parseName(L + (acc||"").replace("♭","b").replace("♯","#")), iv.steps, iv.semis));
    return pre + nameStr(n);
  });
}

window.IIV = {T, parseName, nameStr, prettyName, prettyChord, pcOf, moveName, interval, simplify,
  parseKey, sigFor, realize, lineAbc, lineEvents, voicing, parseChanges, transposeChanges, midiOf, glyph, LET};
})();
