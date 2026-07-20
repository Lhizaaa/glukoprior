/* ===================== NAV + INIT ===================== */
function go(pg){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById('pg-'+pg).classList.add('on');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.pg===pg));
  syncMobileChrome(pg);
  window.scrollTo({top:0,behavior:'smooth'});
  if(pg==='riwayat') renderRiwayat();
  if(pg==='sensitif') renderSensitif();
  if(pg==='profil'){renderProfilPicker(); renderProfilChart();}
}
/* Halaman yang berada di balik tab "Lainnya" pada navigasi bawah (mobile) */
const MSUBPAGES=['banding','sensitif','profil','riwayat'];
function syncMobileChrome(pg){
  const tabPg = MSUBPAGES.includes(pg) ? 'more' : pg;
  document.querySelectorAll('#mbottomnav [data-pg]').forEach(b=>b.classList.toggle('on',b.dataset.pg===tabPg));
  const back=document.getElementById('mBack');
  if(back) back.style.display = MSUBPAGES.includes(pg) ? 'grid' : 'none';
}
document.querySelectorAll('#nav a').forEach(a=>a.onclick=()=>go(a.dataset.pg));
document.querySelectorAll('#mbottomnav [data-pg]').forEach(b=>b.onclick=()=>go(b.dataset.pg));
document.querySelectorAll('#methodTabs .mtab').forEach(b=>b.onclick=()=>{
  curMethod=b.dataset.m;
  document.querySelectorAll('#methodTabs .mtab').forEach(x=>x.classList.toggle('on',x===b));
  renderHasil();
});

function renderAll(includeData=true){
  renderDash(); renderKrit(); renderHasil(); renderCompare();
  renderSensitif(); renderProfilPicker(); renderProfilChart(); renderRiwayat();
  if(includeData) renderData();
}
initProfilSelection();
renderData();
renderAll(false);
syncMobileChrome('dash');

/* ===================== PWA: SERVICE WORKER ===================== */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('SW registration failed:',err));
  });
}
