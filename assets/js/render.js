/* ===================== STATE ===================== */
const isAdmin=()=>ROLE==='admin';
let searchQuery='';
let dashFilter='all';
let curMethod='saw';
let filterMode='none', passingValue=0.5, quotaValue=3;
let sensMethod='saw';
let profilSelected=[];

/* ===================== FOCUS-SAFE RE-RENDER ===================== */
function withFocusPreserved(rerenderFn){
  const active=document.activeElement;
  let fid=null, start=null, end=null, type=null;
  if(active && active.tagName==='INPUT' && active.dataset && active.dataset.focusId){
    fid=active.dataset.focusId; type=active.type;
    if(type==='text'){ try{start=active.selectionStart; end=active.selectionEnd;}catch(e){} }
  }
  rerenderFn();
  if(fid){
    const el=document.querySelector(`[data-focus-id="${fid}"]`);
    if(el){ el.focus(); if(start!=null){ try{el.setSelectionRange(start,end);}catch(e){} } }
  }
}

/* ===================== AUDIT LOG ===================== */
function logAction(text){
  auditLog.unshift({t:new Date(),text,role:ROLE});
  if(auditLog.length>100) auditLog.pop();
  persistAudit();
  const rp=document.getElementById('pg-riwayat');
  if(rp && rp.classList.contains('on')) renderRiwayat();
}
function clearLog(){ if(!isAdmin())return; auditLog=[]; persistAudit(); renderRiwayat(); }

/* ===================== RENDER: DASHBOARD ===================== */
function setDashFilter(fp){
  dashFilter=fp;
  document.querySelectorAll('#dashFilterChips .fchip').forEach(b=>b.classList.toggle('on',b.dataset.fp===fp));
  renderDash();
}
function renderDash(){
  const t=computeTOPSIS(); const rkAll=ranked(t.V);
  const withPL = rkAll.map((r,idx)=>({r,idx,pl:priorityLevel(idx,patients.length)}));
  const topV=rkAll.length?rkAll[0].v.toFixed(3):'0.000';
  const avgH=patients.length?(patients.reduce((a,p)=>a+(p.v[0]||0),0)/patients.length).toFixed(1):'0.0';
  const urgent=withPL.filter(x=>x.pl.k==='p1'||x.pl.k==='p2').length;
  document.getElementById('dashStats').innerHTML=`
    ${statCard('var(--teal)','var(--teal-soft)',iUsers,patients.length,'Total pasien terdaftar','+2 minggu ini','var(--teal)')}
    ${statCard('var(--p1)','var(--p1-soft)',iAlert,urgent,'Perlu prioritas tinggi','butuh tindak lanjut','var(--p1)')}
    ${statCard('var(--blue)','var(--blue-soft)',iDrop,avgH+'%','Rata-rata HbA1c','target < 7,0%','var(--p2)')}
    ${statCard('var(--p4)','var(--p4-soft)',iCheck,topV,'Skor prioritas tertinggi','metode TOPSIS','var(--ink-3)')}`;
  const shown=withPL.filter(x=>dashFilter==='all'||x.pl.k===dashFilter);
  document.getElementById('dashRank').innerHTML = shown.length ? shown.map(({r,idx,pl})=>{
    const p=patients[r.i];
    return `<tr>
      <td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="background:${p.color}">${initials(p.name)}</div>
        <div><b>${p.name}</b><span>${p.id} · ${p.meta}</span></div></div></td>
      <td class="num">${f2(p.v[0])}%</td>
      <td class="num">${p.v[3]!==undefined?p.v[3]:'—'}</td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}"><i class="pdot" style="background:${pl.col}"></i>${pl.lbl}</span></td>
      <td class="num" style="font-weight:600">${r.v.toFixed(4)}</td></tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--ink-3);padding:26px">Tidak ada pasien pada kategori ini.</td></tr>`;
}
function statCard(c,soft,ic,val,lbl,delta,dc){
  return `<div class="stat">
    <div class="ic" style="background:${soft};color:${c}">${ic}</div>
    <div class="v">${val}</div><div class="l">${lbl}</div>
    <div class="d" style="color:${dc}">${delta}</div></div>`;
}

/* ===================== RENDER: DATA PASIEN ===================== */
function onSearchPasien(v){searchQuery=v; renderData();}
function renderData(){
  const tbl=document.getElementById('dataTbl');
  document.getElementById('dataCount').textContent=`${patients.length} alternatif × ${CRIT.length} kriteria`;
  const adminControls=document.getElementById('dataAdminControls');
  if(adminControls) adminControls.style.display = isAdmin()?'flex':'none';
  const viewNote=document.getElementById('dataViewNote');
  if(viewNote) viewNote.style.display = isAdmin()?'none':'flex';
  const q=searchQuery.trim().toLowerCase();
  const rows=patients.map((p,i)=>({p,i})).filter(({p})=>!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q));
  let head=`<thead><tr><th>Alternatif</th>${CRIT.map(c=>`<th class="num">${c.code} · ${c.name}<br><span style="font-weight:400;text-transform:none;color:var(--ink-3)">${c.unit} · ${c.type==='benefit'?'benefit':'cost'}</span></th>`).join('')}${isAdmin()?'<th></th>':''}</tr></thead>`;
  let body='<tbody>'+(rows.length? rows.map(({p,i})=>`<tr>
    <td><div class="patient-cell"><div class="pav" style="background:${p.color}">${initials(p.name)}</div>
      <div style="min-width:150px">${isAdmin()
        ? `<input type="text" value="${p.name}" data-focus-id="pname-${i}" oninput="editName(this,${i})" onblur="finalizeName(this,${i});this.style.borderColor='transparent';this.style.background='transparent'" style="font-weight:600;font-size:13.5px;border:1px solid transparent;background:transparent;padding:2px 4px;width:100%" onfocus="this.style.borderColor='var(--line)';this.style.background='#fff'">`
        : `<b style="font-size:13.5px">${p.name}</b>`}
      <span style="font-size:11.5px;color:var(--ink-3);padding-left:4px">${p.id} · ${p.meta}</span></div></div></td>
    ${p.v.map((val,j)=>`<td class="num">${isAdmin()?`<input type="number" step="0.1" value="${val}" data-focus-id="pval-${i}-${j}" oninput="editCell(this,${i},${j})">`:f2(val)}</td>`).join('')}
    ${isAdmin()?`<td style="text-align:center">${patients.length>1?`<button class="editbtn" title="Hapus pasien" onclick="removePatient(${i})">${iTrash}</button>`:''}</td>`:''}
  </tr>`).join('') : `<tr><td colspan="${CRIT.length+2}" style="text-align:center;color:var(--ink-3);padding:26px">Tidak ada pasien yang cocok dengan pencarian.</td></tr>`)+'</tbody>';
  tbl.innerHTML=head+body;
}
function editCell(el,i,j){
  const v=parseFloat(el.value);
  if(!isNaN(v)){patients[i].v[j]=v; persistPatients(); withFocusPreserved(()=>renderAll(false));}
}
function editName(el,i){
  patients[i].name=el.value;
  persistPatients();
  withFocusPreserved(()=>renderAll(false));
}
function finalizeName(el,i){
  if(!patients[i] || !patients[i].name || !patients[i].name.trim()){
    patients[i].name='Pasien';
    persistPatients();
    withFocusPreserved(()=>renderAll(false));
  }
}
function addPatient(){
  if(!isAdmin())return;
  const used=patients.map(p=>p.id);
  let k=1; while(used.includes('A'+k)) k++;
  const defaults=CRIT.map(()=>5);
  patients.push({id:'A'+k, name:'Pasien Baru '+k, meta:'— th · RM ----',
    color:PALETTE[(patients.length)%PALETTE.length], v:defaults});
  persistPatients();
  logAction(`Menambahkan pasien baru (A${k})`);
  renderAll(true);
  go('data');
  setTimeout(()=>{const rows=document.querySelectorAll('#dataTbl tbody tr');const last=rows[rows.length-1];if(last){last.scrollIntoView({behavior:'smooth',block:'center'});const inp=last.querySelector('input[type=text]');if(inp){inp.focus();inp.select();}}},120);
}
function removePatient(i){
  if(!isAdmin())return;
  const name=patients[i].name;
  patients.splice(i,1);
  profilSelected=profilSelected.filter(x=>x!==i).map(x=>x>i?x-1:x);
  persistPatients();
  logAction(`Menghapus pasien "${name}"`);
  renderAll(true);
}
function resetData(){
  if(!isAdmin())return;
  patients=JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
  CRIT=JSON.parse(JSON.stringify(DEFAULT_CRIT));
  profilSelected=patients.slice(0,2).map((_,i)=>i);
  persistPatients(); persistCrit();
  logAction('Mereset data ke contoh awal');
  renderAll(true);
}

/* ===================== RENDER: KRITERIA ===================== */
function renderKrit(){
  const W=weights();
  const addBtn=document.getElementById('addCritBtn');
  if(addBtn) addBtn.style.display = isAdmin()?'inline-flex':'none';
  const viewNote=document.getElementById('kritViewNote');
  if(viewNote) viewNote.style.display = isAdmin()?'none':'flex';
  document.getElementById('kritList').innerHTML=CRIT.map((c,j)=>`
    <div style="padding:13px 6px;border-bottom:1px solid var(--line-2);${c.locked?'':'background:var(--p2-soft);border-radius:10px;margin-bottom:4px'}">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;flex-wrap:wrap">
        <span class="tag ${c.type==='benefit'?'b':'c'}">${c.code}</span>
        ${isAdmin()
          ? `<input type="text" value="${c.name}" data-focus-id="cname-${j}" oninput="editCritName(this,${j})" onblur="finalizeCritName(this,${j})" style="font-weight:600;font-size:13px;font-family:'Plus Jakarta Sans';width:180px">`
          : `<b style="font-size:13.5px;font-family:'Plus Jakarta Sans'">${c.name}</b>`}
        ${c.locked
          ? `<span class="pchip" style="background:${c.type==='benefit'?'var(--teal-soft)':'var(--blue-soft)'};color:${c.type==='benefit'?'var(--teal-d)':'var(--blue)'}">${iLock}${c.type}</span>`
          : (isAdmin()
             ? `<select onchange="editCritType(this,${j})" style="width:112px">
                  <option value="benefit" ${c.type==='benefit'?'selected':''}>benefit</option>
                  <option value="cost" ${c.type==='cost'?'selected':''}>cost</option>
                </select>
                <button class="btn btn-primary" style="padding:6px 11px;font-size:11.5px" onclick="lockCriterionType(${j})">${iLock}Kunci Sifat</button>`
             : `<span class="tag ${c.type==='benefit'?'b':'c'}">${c.type}</span>`)}
        ${!c.locked ? `<span class="pchip" style="background:var(--p2-soft);color:var(--p2)">Belum dikunci</span>` : ''}
        ${isAdmin() && CRIT.length>2 ? `<button class="editbtn" title="Hapus kriteria" onclick="removeCriterion(${j})" style="margin-left:auto">${iTrash}</button>` : ''}
      </div>
      <div style="font-size:11.5px;color:var(--ink-3);margin-bottom:9px;display:flex;gap:6px">
        ${isAdmin()
          ? `<input type="text" value="${c.desc}" data-focus-id="cdesc-${j}" oninput="editCritDesc(this,${j})" placeholder="Deskripsi" style="font-family:Inter;font-size:11.5px;padding:5px 8px;flex:1.3">
             <input type="text" value="${c.unit}" data-focus-id="cunit-${j}" oninput="editCritUnit(this,${j})" placeholder="Satuan" style="font-family:Inter;font-size:11.5px;padding:5px 8px;flex:1">`
          : `<span>${c.desc} · ${c.unit}</span>`}
      </div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center">
        <input type="range" min="1" max="60" value="${Math.round(c.w*100)}" data-j="${j}" oninput="editWeight(this)" onchange="logWeightChangeFinal(this)" ${isAdmin()?'':'disabled'} style="width:100%;accent-color:var(--teal)">
        <div style="text-align:right;min-width:64px">
          <div class="mono" id="wval-${j}" style="font-size:19px;font-weight:600;color:var(--teal-d)">${f2(W[j])}</div>
          <div id="wpct-${j}" style="font-size:10.5px;color:var(--ink-3)">${(W[j]*100).toFixed(0)}%</div>
        </div>
      </div>
    </div>`).join('');
  document.getElementById('wsum').textContent='Σ bobot = 1,00';
  renderDonut(W);
  populateSensSelect();
}
function editWeight(el){
  if(!isAdmin())return;
  CRIT[+el.dataset.j].w=(+el.value)/100;
  updateWeightLabels();
  renderDash(); renderHasil(); renderCompare();
  if(document.getElementById('pg-sensitif') && document.getElementById('pg-sensitif').classList.contains('on')) renderSensitif();
  if(document.getElementById('pg-profil') && document.getElementById('pg-profil').classList.contains('on')) renderProfilChart();
}
function logWeightChangeFinal(el){
  if(!isAdmin())return;
  persistCrit();
  logAction(`Mengubah bobot ${CRIT[+el.dataset.j].code} menjadi ${el.value}%`);
  renderAll(false);
}
function updateWeightLabels(){
  const W=weights();
  CRIT.forEach((c,j)=>{
    const a=document.getElementById('wval-'+j), b=document.getElementById('wpct-'+j);
    if(a)a.textContent=f2(W[j]);
    if(b)b.textContent=(W[j]*100).toFixed(0)+'%';
  });
  renderDonut(W);
}
function editCritName(el,j){if(!isAdmin())return;CRIT[j].name=el.value; persistCrit(); withFocusPreserved(()=>renderAll(false));}
function finalizeCritName(el,j){
  if(CRIT[j] && (!CRIT[j].name || !CRIT[j].name.trim())){
    CRIT[j].name='Kriteria';
    persistCrit();
    withFocusPreserved(()=>renderAll(false));
  }
}
function editCritDesc(el,j){if(!isAdmin())return;CRIT[j].desc=el.value; persistCrit(); withFocusPreserved(()=>renderAll(false));}
function editCritUnit(el,j){if(!isAdmin())return;CRIT[j].unit=el.value; persistCrit(); withFocusPreserved(()=>renderAll(false));}
function editCritType(el,j){
  if(!isAdmin() || CRIT[j].locked){ el.value=CRIT[j].type; return; }
  CRIT[j].type=el.value;
  persistCrit();
  renderAll(false);
}
function lockCriterionType(j){
  if(!isAdmin())return;
  CRIT[j].locked=true;
  persistCrit();
  logAction(`Mengunci sifat ${CRIT[j].code} sebagai ${CRIT[j].type}`);
  renderAll(false);
}
function addCriterion(){
  if(!isAdmin())return;
  let k=1; while(CRIT.some(c=>c.code==='C'+k)) k++;
  CRIT.push({code:'C'+k,name:'Kriteria Baru',desc:'Deskripsi kriteria',unit:'unit',w:0.10,type:'benefit',locked:false});
  patients.forEach(p=>p.v.push(5));
  persistCrit(); persistPatients();
  logAction(`Menambahkan kriteria ${'C'+k} (menunggu penguncian sifat)`);
  renderAll(true);
  go('krit');
}
function removeCriterion(j){
  if(!isAdmin())return;
  if(CRIT.length<=2){alert('Minimal harus ada 2 kriteria.');return;}
  const code=CRIT[j].code;
  CRIT.splice(j,1);
  patients.forEach(p=>p.v.splice(j,1));
  persistCrit(); persistPatients();
  logAction(`Menghapus kriteria ${code}`);
  renderAll(true);
}
function renderDonut(W){
  const cols=['#0E7C6B','#2E6BB0','#E08A2B','#7A52B0','#D64545','#C9A227','#B0527A','#5BA199'];
  let acc=0,segs='';const R=52,C=2*Math.PI*R;
  W.forEach((w,j)=>{const len=w*C;segs+=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${cols[j%cols.length]}" stroke-width="20" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`;acc+=len;});
  document.getElementById('donut').innerHTML=`
    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">${segs}
        <text x="70" y="66" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="22" fill="var(--ink)">${CRIT.length}</text>
        <text x="70" y="84" text-anchor="middle" font-family="Inter" font-size="10" fill="var(--ink-3)">kriteria</text></svg>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${CRIT.map((c,j)=>`<div style="display:flex;align-items:center;gap:8px;font-size:12px"><i style="width:11px;height:11px;border-radius:3px;background:${cols[j%cols.length]}"></i><b style="font-family:Plus Jakarta Sans;font-size:12px">${c.code}</b><span style="color:var(--ink-3)">${(W[j]*100).toFixed(0)}%</span></div>`).join('')}
      </div></div>`;
}

/* ===================== RENDER: HASIL ===================== */
function setFilterMode(m){
  filterMode=m;
  document.querySelectorAll('#filterModeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.fm===m));
  const wrap=document.getElementById('filterInputWrap');
  if(m==='none'){wrap.style.display='none';}
  else{
    wrap.style.display='flex';
    document.getElementById('filterInputLbl').textContent = m==='passing'?'Nilai minimum V':'Jumlah pasien (top N)';
    document.getElementById('filterInputVal').value = m==='passing'?passingValue:quotaValue;
  }
  logAction(`Mengatur filter hasil ke "${m==='none'?'Tanpa Filter':m==='passing'?'Passing Grade':'Kuota'}"`);
  renderHasil();
}
function onFilterInput(val){
  const v=parseFloat(val); if(isNaN(v))return;
  if(filterMode==='passing') passingValue=v; else quotaValue=Math.max(1,Math.round(v));
  renderHasil();
}
function renderHasil(){
  const data = curMethod==='saw'?computeSAW():computeTOPSIS();
  const rk=ranked(data.V);
  if(!rk.length){document.getElementById('winnerBox').innerHTML='';document.getElementById('methodBody').innerHTML='<div class="card"><div class="card-b" style="text-align:center;color:var(--ink-3)">Belum ada data pasien.</div></div>';return;}
  const w=patients[rk[0].i];
  let filterSummary='';
  if(filterMode!=='none'){
    const passCount=rk.filter((r,idx)=>passStatus(idx,r)).length;
    filterSummary = `<div style="font-size:12px;margin-top:4px;opacity:.9">${passCount} dari ${rk.length} pasien memenuhi syarat ${filterMode==='passing'?`(V ≥ ${f2(passingValue)})`:`(kuota top ${quotaValue})`}</div>`;
  }
  document.getElementById('winnerBox').innerHTML=`
    <div class="winner-card">
      <div class="pav">${initials(w.name)}</div>
      <div><b>Prioritas #1 — ${w.name}</b><span>Direkomendasikan untuk penanganan intensif lebih dahulu · Metode ${curMethod.toUpperCase()}</span>${filterSummary}</div>
      <div class="v"><div class="big">${rk[0].v.toFixed(3)}</div><small>nilai preferensi (V)</small></div>
    </div>`;
  document.getElementById('methodBody').innerHTML = curMethod==='saw'?sawSteps(data,rk):topsisSteps(data,rk);
}
function statusChip(idx,r){
  if(filterMode==='none') return '';
  const pass=passStatus(idx,r);
  return `<td>${pass?`<span class="pchip" style="background:var(--p4-soft);color:var(--p4)">Lulus</span>`:`<span class="pchip" style="background:var(--p1-soft);color:var(--p1)">Tidak Lulus</span>`}</td>`;
}
function matTable(title,sub,M,rowLabels,colLabels,hi){
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><div><h3>${title}</h3><p>${sub}</p></div></div>
   <div class="card-b" style="padding:0;overflow-x:auto"><table class="tbl"><thead><tr><th>Alt.</th>${colLabels.map(c=>`<th class="num">${c}</th>`).join('')}</tr></thead>
   <tbody>${M.map((row,i)=>`<tr><td><b style="font-family:Plus Jakarta Sans">${rowLabels[i]}</b></td>${row.map((v,j)=>`<td class="num" ${hi&&hi(i,j)?'style="background:var(--teal-soft);color:var(--teal-d);font-weight:600"':''}>${f(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function sawSteps(d,rk){
  const cl=CRIT.map(c=>c.code), rl=patients.map(p=>p.id);
  let html=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">1</span>Normalisasi matriks keputusan</div>
    <div class="formula">r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>ij</sub>) &nbsp;<span class="c">untuk benefit</span> &nbsp;·&nbsp; r<sub>ij</sub> = min(x<sub>ij</sub>) / x<sub>ij</sub> &nbsp;<span class="c">untuk cost</span></div>
  </div></div>`;
  html+=matTable('Matriks Ternormalisasi (R)','Setiap nilai diskalakan ke rentang 0–1',d.R,rl,cl);
  html+=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">2</span>Perankingan dengan bobot</div>
    <div class="formula">V<sub>i</sub> = Σ ( w<sub>j</sub> · r<sub>ij</sub> ) &nbsp;<span class="c">— nilai V terbesar = prioritas tertinggi</span></div>
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Pasien</th>${cl.map((c,j)=>`<th class="num">${c}×${f2(d.W[j])}</th>`).join('')}<th class="num">V</th><th>Prioritas</th>${filterMode!=='none'?'<th>Status</th>':''}</tr></thead><tbody>
    ${rk.map((r,idx)=>{const p=patients[r.i],pl=priorityLevel(idx,patients.length);
      return `<tr><td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color}">${initials(p.name)}</div><b style="font-size:13px">${p.name}</b></div></td>
      ${d.R[r.i].map((v,j)=>`<td class="num" style="color:var(--ink-3)">${f(v*d.W[j])}</td>`).join('')}
      <td class="num"><b style="font-size:14px;color:var(--teal-d)">${r.v.toFixed(4)}</b></td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}">${pl.lbl}</span></td>${statusChip(idx,r)}</tr>`;}).join('')}
    </tbody></table></div></div></div>`;
  return html;
}
function topsisSteps(d,rk){
  const cl=CRIT.map(c=>c.code), rl=patients.map(p=>p.id);
  let html=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">1</span>Normalisasi (vektor euclidean)</div>
    <div class="formula">r<sub>ij</sub> = x<sub>ij</sub> / √( Σ x<sub>ij</sub>² )</div></div></div>`;
  html+=matTable('Matriks Ternormalisasi (R)','Normalisasi berbasis panjang vektor kolom',d.R,rl,cl);
  html+=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">2</span>Matriks terbobot</div>
    <div class="formula">y<sub>ij</sub> = w<sub>j</sub> · r<sub>ij</sub></div></div></div>`;
  html+=matTable('Matriks Terbobot (Y)','Setiap kolom dikalikan bobot kriterianya',d.Y,rl,cl);
  html+=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">3</span>Solusi ideal positif (A⁺) &amp; negatif (A⁻)</div>
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Solusi</th>${cl.map((c,j)=>`<th class="num">${c} <span style="color:var(--ink-3);font-weight:400">(${CRIT[j].type==='benefit'?'max':'min'})</span></th>`).join('')}</tr></thead>
    <tbody><tr><td><span class="pchip" style="background:var(--teal-soft);color:var(--teal-d)">A⁺ ideal</span></td>${d.Ap.map(v=>`<td class="num" style="color:var(--teal-d);font-weight:600">${f(v)}</td>`).join('')}</tr>
    <tr><td><span class="pchip" style="background:var(--p1-soft);color:var(--p1)">A⁻ anti-ideal</span></td>${d.Am.map(v=>`<td class="num" style="color:var(--p1);font-weight:600">${f(v)}</td>`).join('')}</tr></tbody></table></div></div></div>`;
  html+=`<div class="card" style="margin-bottom:16px"><div class="card-b">
    <div class="steplead"><span class="n">4 – 5</span>Jarak ke solusi ideal &amp; nilai preferensi</div>
    <div class="formula">D⁺<sub>i</sub> = √Σ(y<sub>ij</sub>−y⁺<sub>j</sub>)² &nbsp;·&nbsp; D⁻<sub>i</sub> = √Σ(y<sub>ij</sub>−y⁻<sub>j</sub>)² &nbsp;·&nbsp; V<sub>i</sub> = D⁻<sub>i</sub> / (D⁺<sub>i</sub> + D⁻<sub>i</sub>)</div>
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Pasien</th><th class="num">D⁺ (jarak ideal)</th><th class="num">D⁻ (jarak anti-ideal)</th><th class="num">V preferensi</th><th>Prioritas</th>${filterMode!=='none'?'<th>Status</th>':''}</tr></thead><tbody>
    ${rk.map((r,idx)=>{const p=patients[r.i],pl=priorityLevel(idx,patients.length);
      return `<tr><td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color}">${initials(p.name)}</div><b style="font-size:13px">${p.name}</b></div></td>
      <td class="num">${f(d.Dp[r.i])}</td><td class="num">${f(d.Dm[r.i])}</td>
      <td class="num"><b style="font-size:14px;color:var(--teal-d)">${r.v.toFixed(4)}</b></td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}">${pl.lbl}</span></td>${statusChip(idx,r)}</tr>`;}).join('')}
    </tbody></table></div></div></div>`;
  return html;
}

/* ===================== RENDER: COMPARE ===================== */
function renderCompare(){
  const s=computeSAW(), t=computeTOPSIS();
  const rs=ranked(s.V), rt=ranked(t.V);
  if(!rs.length){document.getElementById('compareBody').innerHTML='<div class="card"><div class="card-b" style="text-align:center;color:var(--ink-3)">Belum ada data pasien.</div></div>';return;}
  const posS={},posT={};
  rs.forEach((r,idx)=>posS[r.i]=idx+1); rt.forEach((r,idx)=>posT[r.i]=idx+1);
  const sameTop = rs[0].i===rt[0].i;
  let agree=0; patients.forEach((_,i)=>{if(posS[i]===posT[i])agree++;});
  const rows=patients.map((p,i)=>({i,p,rsx:posS[i],rtx:posT[i],vs:s.V[i],vt:t.V[i],diff:posS[i]-posT[i]}))
    .sort((a,b)=>a.rtx-b.rtx);
  let html=`
  <div class="stats" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat"><div class="ic" style="background:var(--teal-soft);color:var(--teal)">${iCheck}</div>
      <div class="v">${agree}/${patients.length}</div><div class="l">Peringkat identik di kedua metode</div></div>
    <div class="stat"><div class="ic" style="background:${sameTop?'var(--p4-soft)':'var(--p2-soft)'};color:${sameTop?'var(--p4)':'var(--p2)'}">${iAlert}</div>
      <div class="v" style="font-size:18px">${sameTop?'Sepakat':'Berbeda'}</div><div class="l">Pemenang #1 — ${sameTop?'kedua metode setuju':'SAW & TOPSIS berbeda'}</div></div>
    <div class="stat"><div class="ic" style="background:var(--blue-soft);color:var(--blue)">${iDrop}</div>
      <div class="v" style="font-size:18px">${patients[rs[0].i].id} / ${patients[rt[0].i].id}</div><div class="l">Top SAW / Top TOPSIS</div></div>
  </div>
  <div class="card" style="margin-bottom:18px"><div class="card-h"><div><h3>Tabel Perbandingan Peringkat</h3><p>Diurutkan menurut peringkat TOPSIS</p></div></div>
   <div class="card-b" style="padding:0;overflow-x:auto"><table class="tbl"><thead><tr>
     <th>Pasien</th><th class="num">Skor SAW</th><th class="num">Rank SAW</th><th class="num">Skor TOPSIS</th><th class="num">Rank TOPSIS</th><th>Selisih</th></tr></thead><tbody>
   ${rows.map(r=>{const p=r.p;
     const dl = r.diff===0?`<span class="pchip" style="background:var(--p4-soft);color:var(--p4)">stabil</span>`
       :`<span class="pchip" style="background:var(--p2-soft);color:var(--p2)">${r.diff>0?'▲':'▼'} ${Math.abs(r.diff)} posisi</span>`;
     return `<tr><td><div class="patient-cell"><div class="pav" style="width:30px;height:30px;font-size:12px;background:${p.color}">${initials(p.name)}</div><div><b>${p.name}</b><span>${p.id}</span></div></div></td>
     <td class="num">${r.vs.toFixed(4)}</td><td class="num"><span class="rank-badge" style="width:24px;height:24px;font-size:12px;background:var(--ink-3)">${r.rsx}</span></td>
     <td class="num">${r.vt.toFixed(4)}</td><td class="num"><span class="rank-badge" style="width:24px;height:24px;font-size:12px;background:var(--teal)">${r.rtx}</span></td>
     <td>${dl}</td></tr>`;}).join('')}
   </tbody></table></div></div>

   <div class="grid2">
     <div class="card"><div class="card-h"><div><h3>Kapan memakai SAW?</h3></div></div><div class="card-b" style="font-size:13px;color:var(--ink-2);line-height:1.65">
       <b style="color:var(--ink);font-family:Plus Jakarta Sans">Penjumlahan terbobot sederhana.</b> SAW memberi skor dengan menjumlahkan nilai ternormalisasi × bobot. Metode ini transparan dan mudah dijelaskan ke tenaga medis, sehingga cocok ketika keputusan perlu mudah diaudit. Kelemahannya: pasien dengan satu nilai ekstrem tinggi bisa "menang" walau tidak seimbang di kriteria lain.</div></div>
     <div class="card"><div class="card-h"><div><h3>Kapan memakai TOPSIS?</h3></div></div><div class="card-b" style="font-size:13px;color:var(--ink-2);line-height:1.65">
       <b style="color:var(--ink);font-family:Plus Jakarta Sans">Kedekatan ke solusi ideal.</b> TOPSIS memilih alternatif yang paling dekat ke kondisi ideal sekaligus terjauh dari kondisi terburuk. Hasilnya cenderung memilih pasien dengan profil risiko yang <i>seimbang &amp; konsisten tinggi</i>, bukan hanya satu indikator ekstrem. Cocok untuk validasi keputusan akhir.</div></div>
   </div>

   <div class="pill-note" style="margin-top:18px">
     ${iBulb}
     <div><b>Rekomendasi sistem:</b> ${sameTop
        ?`Kedua metode sepakat menempatkan <b>${patients[rs[0].i].name}</b> sebagai prioritas tertinggi, sehingga keputusan ini sangat kuat dan dapat langsung ditindaklanjuti.`
        :`SAW memilih <b>${patients[rs[0].i].name}</b> sedangkan TOPSIS memilih <b>${patients[rt[0].i].name}</b>. Karena TOPSIS lebih menghargai keseimbangan profil risiko, sistem menyarankan <b>${patients[rt[0].i].name}</b> sebagai prioritas utama, dengan ${patients[rs[0].i].name} sebagai prioritas berikutnya.`}</div>
   </div>`;
  document.getElementById('compareBody').innerHTML=html;
}

/* ===================== RENDER: SENSITIVITAS ===================== */
function setSensMethod(m){
  sensMethod=m;
  document.querySelectorAll('#sensMethodSeg button').forEach(b=>b.classList.toggle('on',b.dataset.sm===m));
  renderSensitif();
}
function populateSensSelect(){
  const sel=document.getElementById('sensCrit');
  if(!sel)return;
  const prev=sel.value;
  sel.innerHTML=CRIT.map((c,j)=>`<option value="${j}">${c.code} · ${c.name}</option>`).join('');
  if(prev && +prev<CRIT.length) sel.value=prev;
}
function rescaledWeights(critIdx,newFrac){
  const others=CRIT.map((c,j)=>j).filter(j=>j!==critIdx);
  const otherSum=others.reduce((a,j)=>a+CRIT[j].w,0)||1;
  const remaining=1-newFrac;
  return CRIT.map((c,j)=> j===critIdx? newFrac : (c.w/otherSum)*remaining );
}
function renderSensitif(){
  const sel=document.getElementById('sensCrit');
  if(!sel)return;
  if(!sel.options.length || !patients.length){document.getElementById('sensBody').innerHTML='<div class="card"><div class="card-b" style="text-align:center;color:var(--ink-3)">Belum ada data untuk disimulasikan.</div></div>';return;}
  const j=+sel.value||0;
  const pct=+document.getElementById('sensSlider').value;
  document.getElementById('sensValLbl').textContent=pct+'%';
  const custW=rescaledWeights(j,pct/100);
  const base = sensMethod==='saw'?computeSAW():computeTOPSIS();
  const sim = sensMethod==='saw'?computeSAW(custW):computeTOPSIS(custW);
  const rkBase=ranked(base.V), rkSim=ranked(sim.V);
  const posBase={}; rkBase.forEach((r,idx)=>posBase[r.i]=idx+1);
  const maxV=Math.max(...sim.V,0.0001);
  const bars = rkSim.map((r,idx)=>{
    const p=patients[r.i]; const diff=posBase[r.i]-(idx+1);
    const wpct=(r.v/maxV*100).toFixed(1);
    return `<div style="display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid var(--line-2)">
      <span class="rank-badge" style="width:26px;height:26px;font-size:12px;background:${priorityLevel(idx,patients.length).col}">${idx+1}</span>
      <div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color}">${initials(p.name)}</div>
      <div style="width:150px;font-size:12.5px;font-weight:600">${p.name}</div>
      <div class="scorebar" style="flex:1"><i style="width:${wpct}%;background:${p.color}"></i></div>
      <div class="mono" style="width:60px;text-align:right;font-size:12.5px">${r.v.toFixed(4)}</div>
      <div style="width:100px;text-align:right">${diff===0?'<span class="pchip" style="background:var(--p4-soft);color:var(--p4)">tetap</span>':`<span class="pchip" style="background:var(--p2-soft);color:var(--p2)">${diff>0?'▲':'▼'} ${Math.abs(diff)}</span>`}</div>
    </div>`;
  }).join('');
  document.getElementById('sensBody').innerHTML = `
    <div class="card"><div class="card-h"><div><h3>Simulasi Ranking — ${CRIT[j].code} · ${CRIT[j].name} diset ${pct}%</h3><p>Bobot kriteria lain diskalakan proporsional agar total tetap 1,00 · metode ${sensMethod.toUpperCase()}</p></div></div>
     <div class="card-b"><div class="sens-scroll">${bars}</div></div></div>
    <div class="pill-note" style="margin-top:16px">
      ${iInfo}
      <div>Simulasi ini <b>tidak mengubah</b> bobot tersimpan di halaman Kriteria &amp; Bobot. Panah menunjukkan perubahan posisi ranking dibanding pengaturan bobot saat ini — gunakan untuk menguji seberapa stabil keputusan sebelum benar-benar mengubah bobot.</div>
    </div>`;
}

/* ===================== RENDER: PROFIL RADAR ===================== */
function initProfilSelection(){ profilSelected = patients.slice(0,Math.min(2,patients.length)).map((_,i)=>i); }
function renderProfilPicker(){
  const el=document.getElementById('profilPicker');
  if(!el)return;
  el.innerHTML = patients.length ? patients.map((p,i)=>{
    const checked=profilSelected.includes(i);
    return `<label style="display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:9px;cursor:pointer;background:${checked?'var(--teal-soft)':'transparent'}">
      <input type="checkbox" ${checked?'checked':''} onchange="toggleProfil(${i},this.checked)" style="width:16px;height:16px;flex-shrink:0">
      <div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color};flex-shrink:0">${initials(p.name)}</div>
      <span style="font-size:12.5px;font-weight:600">${p.name}</span></label>`;
  }).join('') : '<div style="padding:20px;color:var(--ink-3);font-size:13px">Belum ada pasien.</div>';
}
function toggleProfil(i,checked){
  if(checked){
    if(profilSelected.length>=3){ alert('Maksimal 3 pasien untuk perbandingan radar.'); renderProfilPicker(); return; }
    profilSelected.push(i);
  } else { profilSelected=profilSelected.filter(x=>x!==i); }
  renderProfilPicker(); renderProfilChart();
}
function renderProfilChart(){
  const el=document.getElementById('profilChart');
  if(!el)return;
  if(!patients.length){el.innerHTML='<div style="padding:40px;color:var(--ink-3);font-size:13px">Belum ada data pasien.</div>';return;}
  if(profilSelected.length===0){el.innerHTML='<div style="padding:40px;color:var(--ink-3);font-size:13px">Pilih minimal 1 pasien untuk menampilkan radar.</div>';return;}
  const s=computeSAW();
  const m=CRIT.length;
  const cx=180,cy=180,R=135;
  const angle=(k)=>-Math.PI/2 + k*(2*Math.PI/m);
  const axisLines=CRIT.map((c,k)=>{const a=angle(k);const x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#E1E8EF" stroke-width="1"/>`;}).join('');
  const rings=[0.25,0.5,0.75,1].map(fr=>{const pts=CRIT.map((c,k)=>{const a=angle(k);return `${cx+R*fr*Math.cos(a)},${cy+R*fr*Math.sin(a)}`;}).join(' ');return `<polygon points="${pts}" fill="none" stroke="#EDF2F6" stroke-width="1"/>`;}).join('');
  const labels=CRIT.map((c,k)=>{const a=angle(k);const x=cx+(R+26)*Math.cos(a),y=cy+(R+26)*Math.sin(a);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-size="10.5" fill="#52677A">${c.code}</text>`;}).join('');
  const polys=profilSelected.map(pi=>{
    const p=patients[pi];
    const pts=CRIT.map((c,k)=>{const val=Math.max(0,Math.min(1,s.R[pi][k]||0));const a=angle(k);return `${cx+R*val*Math.cos(a)},${cy+R*val*Math.sin(a)}`;}).join(' ');
    return `<polygon points="${pts}" fill="${p.color}29" stroke="${p.color}" stroke-width="2.2"/>`;
  }).join('');
  const legend=profilSelected.map(pi=>{const p=patients[pi];return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;margin:0 12px 6px 0"><i style="width:10px;height:10px;border-radius:3px;background:${p.color};display:inline-block"></i>${p.name}</span>`;}).join('');
  el.innerHTML=`<div style="text-align:center">
    <svg width="360" height="360" viewBox="0 0 360 360">${rings}${axisLines}${polys}${labels}</svg>
    <div style="margin-top:4px">${legend}</div></div>`;
}

/* ===================== RIWAYAT ===================== */
function renderRiwayat(){
  const el=document.getElementById('auditBody');
  if(!el)return;
  const clearBtn=document.getElementById('clearLogBtn');
  if(clearBtn) clearBtn.style.display = isAdmin()?'inline-flex':'none';
  if(!auditLog.length){el.innerHTML='<div style="padding:30px 4px;color:var(--ink-3);font-size:13px;text-align:center">Belum ada aktivitas tercatat.</div>';return;}
  el.innerHTML = auditLog.map(a=>`
    <div class="audit-item"><div class="audit-ic">${iClock}</div>
      <div><div class="t">${a.text}</div><div class="ts">${a.t.toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} · oleh ${a.role==='admin'?'Admin':'Petugas'}</div></div>
    </div>`).join('');
}

/* ===================== CETAK LAPORAN ===================== */
function printReport(){
  const method=curMethod;
  const data = method==='saw'?computeSAW():computeTOPSIS();
  const rk=ranked(data.V);
  const rows=rk.map((r,idx)=>{
    const p=patients[r.i], pl=priorityLevel(idx,patients.length);
    const status = filterMode==='none' ? '' : `<td style="padding:8px;border:1px solid #E1E8EF">${passStatus(idx,r)?'Lulus':'Tidak Lulus'}</td>`;
    return `<tr><td style="padding:8px;border:1px solid #E1E8EF">${idx+1}</td><td style="padding:8px;border:1px solid #E1E8EF">${p.name}</td><td style="padding:8px;border:1px solid #E1E8EF">${p.id}</td><td style="padding:8px;border:1px solid #E1E8EF;text-align:right">${r.v.toFixed(4)}</td><td style="padding:8px;border:1px solid #E1E8EF">${pl.lbl}</td>${status}</tr>`;
  }).join('');
  document.getElementById('printReport').innerHTML = `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#15232E">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:30px;height:30px;border-radius:9px;background:#0A5C4F"></div>
        <div><b style="font-size:18px">GlukoPrior</b> — Laporan Prioritas Penanganan Pasien</div>
      </div>
      <div style="font-size:12px;color:#52677A;margin-bottom:18px;font-family:Inter">Program Prolanis · Diabetes Melitus Tipe 2 · Dicetak ${new Date().toLocaleString('id-ID')} · Metode ${method.toUpperCase()}${filterMode!=='none'?` · Filter: ${filterMode==='passing'?'Passing grade ≥ '+f2(passingValue):'Kuota top '+quotaValue}`:''}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;font-family:Inter">
        <thead><tr style="background:#F6F9FB">
          <th style="text-align:left;padding:8px;border:1px solid #E1E8EF">#</th>
          <th style="text-align:left;padding:8px;border:1px solid #E1E8EF">Nama</th>
          <th style="text-align:left;padding:8px;border:1px solid #E1E8EF">ID</th>
          <th style="text-align:right;padding:8px;border:1px solid #E1E8EF">Nilai V</th>
          <th style="text-align:left;padding:8px;border:1px solid #E1E8EF">Prioritas</th>
          ${filterMode!=='none'?'<th style="text-align:left;padding:8px;border:1px solid #E1E8EF">Status</th>':''}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:11px;color:#8499A9;margin-top:16px;font-family:Inter">Dokumen ini dihasilkan otomatis oleh sistem GlukoPrior untuk keperluan tindak lanjut klinis internal.</div>
    </div>`;
  logAction(`Mencetak laporan (metode ${method.toUpperCase()})`);
  window.print();
}
