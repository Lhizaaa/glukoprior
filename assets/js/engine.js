/* ===================== ENGINE (SAW & TOPSIS) ===================== */
function weights(){const s=CRIT.reduce((a,c)=>a+c.w,0)||1;return CRIT.map(c=>c.w/s);}
function matrix(){return patients.map(p=>p.v.slice());}

function computeSAW(){
  const X=matrix(), W=weights(), n=patients.length, m=CRIT.length;
  const R=[];
  for(let i=0;i<n;i++){R.push([]);}
  for(let j=0;j<m;j++){
    const col=X.map(r=>r[j]); const mx=Math.max(...col), mn=Math.min(...col);
    for(let i=0;i<n;i++) R[i][j]= CRIT[j].type==='benefit' ? X[i][j]/mx : mn/X[i][j];
  }
  const V=R.map(r=>r.reduce((a,v,j)=>a+v*W[j],0));
  return {X,R,V,W};
}
function computeTOPSIS(){
  const X=matrix(), W=weights(), n=patients.length, m=CRIT.length;
  const denom=[];
  for(let j=0;j<m;j++) denom[j]=Math.sqrt(X.reduce((a,r)=>a+r[j]*r[j],0));
  const R=X.map(r=>r.map((v,j)=>v/denom[j]));
  const Y=R.map(r=>r.map((v,j)=>v*W[j]));
  const Ap=[],Am=[];
  for(let j=0;j<m;j++){
    const col=Y.map(r=>r[j]), mx=Math.max(...col), mn=Math.min(...col);
    if(CRIT[j].type==='benefit'){Ap[j]=mx;Am[j]=mn;}else{Ap[j]=mn;Am[j]=mx;}
  }
  const Dp=Y.map(r=>Math.sqrt(r.reduce((a,v,j)=>a+(v-Ap[j])**2,0)));
  const Dm=Y.map(r=>Math.sqrt(r.reduce((a,v,j)=>a+(v-Am[j])**2,0)));
  const V=Dp.map((_,i)=>Dm[i]/(Dp[i]+Dm[i]));
  return {X,R,Y,Ap,Am,Dp,Dm,V,W};
}
function ranked(V){return V.map((v,i)=>({i,v})).sort((a,b)=>b.v-a.v);}
function priorityLevel(rankIndex,total){
  // rankIndex 0 = highest priority
  const q=rankIndex/Math.max(total-1,1);
  if(q<=0.2) return {lbl:'Sangat Tinggi',col:'var(--p1)',soft:'var(--p1-soft)',k:'p1'};
  if(q<=0.45)return {lbl:'Tinggi',col:'var(--p2)',soft:'var(--p2-soft)',k:'p2'};
  if(q<=0.7) return {lbl:'Sedang',col:'var(--p3)',soft:'var(--p3-soft)',k:'p3'};
  return {lbl:'Rendah',col:'var(--p4)',soft:'var(--p4-soft)',k:'p4'};
}
const f=(x,d=4)=>Number(x).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
const f2=(x)=>Number(x).toLocaleString('id-ID',{maximumFractionDigits:2});
