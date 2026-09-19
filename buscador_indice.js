// Motor de referencia del indice PsicoFlujo (sin dependencias). Uso: const {crearIndice,buscar}=require('./buscador_indice.js')
const STOP = new Set(['de','del','la','el','los','las','y','e','o','u','en','para','por','con','un','una','and','or','of','the','to','for','in','a','trastorno','trastornos','disorder','disorders','escala','escalas','inventario','cuestionario','test','prueba','pruebas','scale','inventory','questionnaire']);
const ROM = {i:1,ii:2,iii:3,iv:4,v:5,vi:6,vii:7,viii:8,ix:9,x:10};
function norm(s){ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function compacta(s){ return norm(s).replace(/ /g,''); }
function tokens(s){ return norm(s).split(' ').filter(t=>t && !STOP.has(t)); }
function raiz(t){ if(t.length>4 && t.endsWith('es')) return t.slice(0,-2); if(t.length>3 && t.endsWith('s')) return t.slice(0,-1); return t; }
function dist(a,b,max){ // Levenshtein acotado
  if(Math.abs(a.length-b.length)>max) return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){ const cur=[i]; let mn=i;
    for(let j=1;j<=b.length;j++){ const c=a[i-1]===b[j-1]?0:1; const v=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+c); cur.push(v); if(v<mn)mn=v; }
    if(mn>max) return max+1; prev=cur; }
  return prev[b.length];
}
// variantes romano<->arabigo de una sigla compacta o por tokens (BDI-II <-> BDI 2)
function variantesNum(s){ const out=new Set(); const t=norm(s).split(' ');
  out.add(t.join('')); 
  const alt=t.map(x=>ROM[x]?String(ROM[x]):x); out.add(alt.join(''));
  const alt2=t.map(x=>/^[a-z]+$/.test(x)?x:x.replace(/(\D)(ii|iii|iv)$/,(m,a,b)=>a+ROM[b])); out.add(alt2.join(''));
  const m=t.join('').match(/^(.*?[a-z])(ii|iii|iv)$/); if(m) out.add(m[1]+ROM[m[2]]);
  const n=t.join('').match(/^(.*?[a-z])(2|3|4)$/); if(n){ const r={2:'ii',3:'iii',4:'iv'}[n[2]]; out.add(n[1]+r); }
  return [...out].filter(Boolean);
}
function crearIndice(data){
  const temas={}; data.temas.forEach(t=>temas[t.id]=t);
  const fams=data.familias.map(f=>{
    const T=[]; // [texto normalizado como frase, peso, tipo]
    const add=(txt,w,tipo)=>{ if(txt){ const n=norm(txt); if(n) T.push({n,c:n.replace(/ /g,''),w,tipo}); } };
    variantesNum(f.sigla).forEach(v=>T.push({n:v,c:v,w:60,tipo:'sigla'}));
    (f.alias||[]).forEach(a=>{ variantesNum(a).forEach(v=>T.push({n:v,c:v,w:55,tipo:'alias'})); add(a,55,'alias'); });
    add(f.nombre,40,'nombre'); add(f.en,40,'en'); add(f.constructo,35,'constructo'); (f.franjas||[]).forEach(x=>add(x,25,'franja')); add(f.fuente,10,'fuente');
    const tp=temas[f.tema]; const push=(t,k)=>{ if(!t) return; add(t.nombre,34*k,'tema'); (t.terminos||[]).forEach(x=>add(x,30*k,'tema'));
      add(t.apa&&t.apa.pn,12*k,'equiv'); add(t.apa&&t.apa.p,12*k,'equiv'); add(t.apa&&t.apa.s,6*k,'equiv'); add(t.apa&&t.apa.sn,6*k,'equiv'); add(t.hitop&&t.hitop.grupo,8*k,'equiv'); add(t.hitop&&t.hitop.detalle,8*k,'equiv'); add(t.dsm5,8*k,'equiv'); };
    push(tp,0.8); (f.sec||[]).forEach(s=>push(temas[s],0.32));
    return {f,T};
  });
  return {fams,ejes:data.ejes,temas};
}
function puntuarToken(fam,tok,rt){ let best=0;
  for(const e of fam.T){
    const words=e.n.split(' ');
    let s=0;
    if(e.c===tok) s=e.w;                                    // coincide toda la frase/sigla
    else if(words.some(w=>w===tok||raiz(w)===rt)) s=e.w*0.9;   // palabra completa
    else if(tok.length>=3 && words.some(w=>w.startsWith(tok))) s=e.w*0.7; // prefijo
    else if(tok.length>=4 && /[a-z]/.test(tok)){ const max=tok.length>=8?2:1; if(words.some(w=>Math.abs(w.length-tok.length)<=max && dist(w,tok,max)<=max)) s=e.w*0.55; }
    if(s>best) best=s; }
  return best;
}
function buscar(idx,consulta,opt){ opt=opt||{}; const lim=opt.limite||20;
  const q=norm(consulta); if(!q) return [];
  const qc=q.replace(/ /g,''); const qv=variantesNum(consulta);
  const toks=tokens(consulta); const res=[];
  for(const fam of idx.fams){
    let score=0,parcial=false;
    if(fam.T.some(e=>(e.tipo==='sigla'||e.tipo==='alias')&&qv.includes(e.c))) score=1000;
    else if(toks.length){
      const ps=toks.map(t=>puntuarToken(fam,t,raiz(t)));
      const ok=ps.filter(p=>p>0).length;
      if(ok===toks.length) score=ps.reduce((a,b)=>a+b,0)/toks.length + (ps.length>1?ps.reduce((a,b)=>a+b,0)*0.1:0);
      else if(ok>0 && opt.parcial!==false){ score=ps.reduce((a,b)=>a+b,0)/toks.length*0.3; parcial=true; }
    }
    if(score>0) res.push({id:fam.f.id,sigla:fam.f.sigla,nombre:fam.f.nombre,eje:fam.f.eje,tema:fam.f.tema,score:Math.round(score*10)/10,parcial});
  }
  res.sort((a,b)=>b.score-a.score||a.sigla.localeCompare(b.sigla));
  const completos=res.filter(r=>!r.parcial);
  return (completos.length?completos:res).slice(0,lim);
}
module.exports={norm,compacta,tokens,raiz,dist,crearIndice,buscar,variantesNum};

// CLI:  node buscador_indice.js indice_psicoflujo.json "consulta"   |   node buscador_indice.js indice_psicoflujo.json --probar
if(typeof window==='undefined' && typeof require!=='undefined' && require.main===module){
  const fs=eval("require")('fs'); const [,,ruta,...resto]=process.argv;
  if(!ruta){ console.log('Uso: node buscador_indice.js indice_psicoflujo.json "consulta" | --probar'); process.exit(0); }
  const data=JSON.parse(fs.readFileSync(ruta,'utf8')); const idx=crearIndice(data);
  if(resto[0]==='--probar'){ let ok=0; const P=data.pruebas||[];
    for(const [q,esp,n] of P){ const r=buscar(idx,q,{limite:n}); const pos=r.findIndex(x=>x.sigla===esp);
      if(pos>=0) ok++; else console.log('FALLA',JSON.stringify(q),'esperada',esp,'en top',n,'->',r.slice(0,4).map(x=>x.sigla).join(', ')||'(sin resultados)'); }
    console.log(ok+'/'+P.length+' pruebas OK'); process.exit(ok===P.length?0:1); }
  const r=buscar(idx,resto.join(' '),{limite:15}); r.forEach(x=>console.log(x.score+'\t'+x.sigla+'\t'+x.nombre+(x.parcial?'  (coincidencia parcial)':'')));
}
