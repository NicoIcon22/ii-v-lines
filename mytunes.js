/* My tunes: every tune generated on the page, saved in this browser (IndexedDB).
 *
 * A record: {id, title, key, changes, seed, pdf:{name,type,blob}|null, keyLabel, targets,
 *            lib, created, updated}
 * id is the normalized title, so generating the same tune again updates its record.
 * If IndexedDB isn't available (some private windows), the list lives in memory for the
 * session only.
 */
(function(){
const DB = "iiv-lines", STORE = "tunes";
let dbp = null; const mem = new Map();
function db(){
  if(!dbp) dbp = new Promise(res=>{
    try{
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = ()=> r.result.createObjectStore(STORE, {keyPath:"id"});
      r.onsuccess = ()=> res(r.result);
      r.onerror = ()=> res(null);
      r.onblocked = ()=> res(null);
    }catch(e){ res(null); }
  });
  return dbp;
}
const req = r => new Promise((res, rej)=>{ r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); });
async function store(mode){ const d = await db(); return d ? d.transaction(STORE, mode).objectStore(STORE) : null; }

async function get(id){
  try{ const s = await store("readonly"); return s ? (await req(s.get(id))) || null : mem.get(id) || null; }
  catch(e){ return mem.get(id) || null; }
}
async function put(rec){
  try{ const s = await store("readwrite"); if(s){ await req(s.put(rec)); return true; } }
  catch(e){
    /* some browsers refuse to store files: keep the tune without its PDF */
    if(rec.pdf){ try{ const s = await store("readwrite"); await req(s.put(Object.assign({}, rec, {pdf:null}))); return "nopdf"; }catch(e2){} }
  }
  mem.set(rec.id, rec); return "memory";
}
async function del(id){
  try{ const s = await store("readwrite"); if(s) await req(s.delete(id)); }catch(e){}
  mem.delete(id);
}
async function all(){
  let a = [];
  try{ const s = await store("readonly"); a = s ? await req(s.getAll()) : []; }catch(e){}
  mem.forEach((v,k)=>{ if(!a.some(r=>r.id===k)) a.push(v); });
  return a.sort((x,y)=> y.updated - x.updated);
}
async function persistent(){ return !!(await db()); }

/* ---------- export / import ---------- */
const toDataUrl = blob => new Promise((res, rej)=>{ const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = ()=>rej(fr.error); fr.readAsDataURL(blob); });
async function fromDataUrl(u){ return (await fetch(u)).blob(); }

async function exportAll(){
  const tunes = await all(), out = [];
  for(const r of tunes){
    const o = Object.assign({}, r);
    if(r.pdf && r.pdf.blob) o.pdf = {name:r.pdf.name, type:r.pdf.type || "application/pdf", data: await toDataUrl(r.pdf.blob)};
    out.push(o);
  }
  return new Blob([JSON.stringify({app:"ii-v-lines", version:1, exported:new Date().toISOString(), tunes:out}, null, 1)], {type:"application/json"});
}
async function importFile(file){
  const data = JSON.parse(await file.text());
  const list = Array.isArray(data) ? data : data.tunes;
  if(!Array.isArray(list)) throw new Error("That file isn't a ii–V Lines export.");
  let added = 0, updated = 0;
  for(const t of list){
    if(!t || !t.id || !t.title) continue;
    const rec = Object.assign({}, t);
    if(t.pdf && t.pdf.data){ rec.pdf = {name:t.pdf.name, type:t.pdf.type, blob: await fromDataUrl(t.pdf.data)}; }
    else rec.pdf = null;
    const cur = await get(rec.id);
    if(!cur){ await put(rec); added++; }
    else if((rec.updated||0) > (cur.updated||0)){ await put(Object.assign(rec, {created: Math.min(cur.created||rec.created, rec.created||cur.created)})); updated++; }
  }
  return {added, updated};
}

window.MYTUNES = {get, put, del, all, persistent, exportAll, importFile};
})();
