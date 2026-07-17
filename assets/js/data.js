/* ===================== MODEL DATA ===================== */
const DEFAULT_PATIENTS = [
  {id:'A1', name:'Ny. Siti Aminah',  meta:'58 th · No. RM 0421', color:'#D64545', v:[7.8,160,140,2,3]},
  {id:'A2', name:'Tn. Budi Santoso',  meta:'64 th · No. RM 0188', color:'#E08A2B', v:[10.2,220,160,3,2]},
  {id:'A3', name:'Tn. Andi Wijaya',   meta:'47 th · No. RM 0533', color:'#3E9D6E', v:[7.2,145,148,1,5]},
  {id:'A4', name:'Ny. Rina Hartati',  meta:'61 th · No. RM 0307', color:'#2E6BB0', v:[9.8,200,145,4,3]},
  {id:'A5', name:'Tn. Joko Prasetyo', meta:'69 th · No. RM 0299', color:'#7A52B0', v:[11.5,250,155,2,1]},
];
const DEFAULT_CRIT = [
  {code:'C1', name:'HbA1c', desc:'Kadar gula darah 3 bulan', unit:'%',       w:0.30, type:'benefit', locked:true},
  {code:'C2', name:'Gula Darah Puasa', desc:'GDP', unit:'mg/dL',             w:0.20, type:'benefit', locked:true},
  {code:'C3', name:'Tekanan Darah Sistolik', desc:'Komorbid hipertensi', unit:'mmHg', w:0.15, type:'benefit', locked:true},
  {code:'C4', name:'Jumlah Komplikasi', desc:'Retinopati, nefropati, dll', unit:'kondisi', w:0.25, type:'benefit', locked:true},
  {code:'C5', name:'Tingkat Kepatuhan', desc:'1=buruk … 5=sangat patuh', unit:'skala', w:0.10, type:'cost', locked:true},
];
const PALETTE=['#D64545','#E08A2B','#3E9D6E','#2E6BB0','#7A52B0','#0E7C6B','#C9A227','#B0527A','#527AB0','#5BA199'];

/* ===================== PERSISTENCE (shared across admin.html & petugas.html) ===================== */
const LS_KEYS = {patients:'glukoprior_patients', crit:'glukoprior_crit', audit:'glukoprior_audit'};

function loadPatients(){
  try{
    const raw=localStorage.getItem(LS_KEYS.patients);
    if(raw){const parsed=JSON.parse(raw); if(Array.isArray(parsed)&&parsed.length) return parsed;}
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
}
function loadCrit(){
  try{
    const raw=localStorage.getItem(LS_KEYS.crit);
    if(raw){const parsed=JSON.parse(raw); if(Array.isArray(parsed)&&parsed.length) return parsed;}
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_CRIT));
}
function loadAudit(){
  try{
    const raw=localStorage.getItem(LS_KEYS.audit);
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed.map(a=>({...a,t:new Date(a.t)}));
    }
  }catch(e){}
  return [];
}
function persistPatients(){ try{localStorage.setItem(LS_KEYS.patients,JSON.stringify(patients));}catch(e){} }
function persistCrit(){ try{localStorage.setItem(LS_KEYS.crit,JSON.stringify(CRIT));}catch(e){} }
function persistAudit(){ try{localStorage.setItem(LS_KEYS.audit,JSON.stringify(auditLog));}catch(e){} }

let patients = loadPatients();
let CRIT = loadCrit();
let auditLog = loadAudit();
