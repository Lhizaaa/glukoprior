/* ===================== NAV + INIT ===================== */
function go(pg){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('pg-'+pg).classList.add('on');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.pg===pg));
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderAll(includeData=true){
  renderDash(); renderKrit(); renderHasil(); renderCompare();
  if(includeData) renderData();
}

document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.pg));
document.querySelectorAll('#methodTabs .mtab').forEach(b=>b.onclick=()=>{
  curMethod=b.dataset.m;
  document.querySelectorAll('#methodTabs .mtab').forEach(x=>x.classList.toggle('on',x===b));
  renderHasil();
});

renderData(); renderAll(false);

/* ===================== PWA: SERVICE WORKER ===================== */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('SW registration failed:',err));
  });
}
