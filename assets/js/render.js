/* ===================== RENDER: DASHBOARD ===================== */
function renderDash(){
  const t=computeTOPSIS(), rk=ranked(t.V);
  const topV=rk[0].v.toFixed(3);
  const avgH=(patients.reduce((a,p)=>a+p.v[0],0)/patients.length).toFixed(1);
  const urgent=rk.filter((r,idx)=>priorityLevel(idx,patients.length).k==='p1'||priorityLevel(idx,patients.length).k==='p2').length;
  document.getElementById('dashStats').innerHTML=`
    ${statCard('var(--teal)','var(--teal-soft)',iUsers,patients.length,'Total pasien terdaftar','+2 minggu ini','var(--teal)')}
    ${statCard('var(--p1)','var(--p1-soft)',iAlert,urgent,'Perlu prioritas tinggi','butuh tindak lanjut','var(--p1)')}
    ${statCard('var(--blue)','var(--blue-soft)',iDrop,avgH+'%','Rata-rata HbA1c','target < 7,0%','var(--p2)')}
    ${statCard('var(--p4)','var(--p4-soft)',iCheck,topV,'Skor prioritas tertinggi','metode TOPSIS','var(--ink-3)')}`;
  document.getElementById('dashRank').innerHTML=rk.map((r,idx)=>{
    const p=patients[r.i], pl=priorityLevel(idx,patients.length);
    return `<tr style="cursor:pointer">
      <td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="background:${p.color}">${initials(p.name)}</div>
        <div><b>${p.name}</b><span>${p.id} · ${p.meta}</span></div></div></td>
      <td class="num">${f2(p.v[0])}%</td>
      <td class="num">${p.v[3]}</td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}"><i class="pdot" style="background:${pl.col}"></i>${pl.lbl}</span></td>
      <td class="num" style="font-weight:600">${r.v.toFixed(4)}</td></tr>`;
  }).join('');
}
function statCard(c,soft,ic,val,lbl,delta,dc){
  return `<div class="stat">
    <div class="ic" style="background:${soft};color:${c}">${ic}</div>
    <div class="v">${val}</div><div class="l">${lbl}</div>
    <div class="d" style="color:${dc}">${delta}</div></div>`;
}

/* ===================== RENDER: DATA PASIEN ===================== */
function renderData(){
  const tbl=document.getElementById('dataTbl');
  document.querySelector('#pg-data .card-h p').textContent=`${patients.length} alternatif × ${CRIT.length} kriteria`;
  let head=`<thead><tr><th>Alternatif</th>${CRIT.map(c=>`<th class="num">${c.code} · ${c.name}<br><span style="font-weight:400;text-transform:none;color:var(--ink-3)">${c.unit} · ${c.type==='benefit'?'benefit':'cost'}</span></th>`).join('')}<th></th></tr></thead>`;
  let body='<tbody>'+patients.map((p,i)=>`<tr>
    <td><div class="patient-cell"><div class="pav" style="background:${p.color}">${initials(p.name)}</div>
      <div style="min-width:150px"><input type="text" value="${p.name}" data-i="${i}" oninput="editName(this)" style="font-weight:600;font-size:13.5px;border:1px solid transparent;background:transparent;padding:2px 4px;width:100%" onfocus="this.style.borderColor='var(--line)';this.style.background='#fff'" onblur="this.style.borderColor='transparent';this.style.background='transparent'">
      <span style="font-size:11.5px;color:var(--ink-3);padding-left:4px">${p.id} · ${p.meta}</span></div></div></td>
    ${p.v.map((val,j)=>`<td class="num"><input type="number" step="0.1" value="${val}" data-i="${i}" data-j="${j}" oninput="editCell(this)"></td>`).join('')}
    <td style="text-align:center">${patients.length>1?`<button class="editbtn" title="Hapus pasien" onclick="removePatient(${i})"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M10 11v6M14 11v6"/></svg></button>`:''}</td>
  </tr>`).join('')+'</tbody>';
  tbl.innerHTML=head+body;
}
function editCell(el){
  const i=+el.dataset.i, j=+el.dataset.j, v=parseFloat(el.value);
  if(!isNaN(v)){patients[i].v[j]=v; renderAll(false);}
}
function editName(el){const i=+el.dataset.i; patients[i].name=el.value||'Pasien'; renderAll(false);}
function addPatient(){
  const n=patients.length+1;
  const used=patients.map(p=>p.id);
  let k=1; while(used.includes('A'+k)) k++;
  patients.push({id:'A'+k, name:'Pasien Baru '+k, meta:'— th · RM ----',
    color:PALETTE[(patients.length)%PALETTE.length],
    v:[8.0,170,140,1,3]});
  renderAll(true);
  go('data');
  setTimeout(()=>{const rows=document.querySelectorAll('#dataTbl tbody tr');const last=rows[rows.length-1];if(last){last.scrollIntoView({behavior:'smooth',block:'center'});last.querySelector('input[type=text]').focus();last.querySelector('input[type=text]').select();}},120);
}
function removePatient(i){patients.splice(i,1);renderAll(true);}
function resetData(){patients=JSON.parse(JSON.stringify(DEFAULT_PATIENTS));renderAll(true);}

/* ===================== RENDER: KRITERIA ===================== */
function renderKrit(){
  const W=weights();
  document.getElementById('kritList').innerHTML=CRIT.map((c,j)=>`
    <div style="padding:13px 6px;border-bottom:1px solid var(--line-2);display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center">
      <div>
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:3px">
          <span class="tag ${c.type==='benefit'?'b':'c'}">${c.code}</span>
          <b style="font-size:13.5px;font-family:'Plus Jakarta Sans'">${c.name}</b>
          <span class="tag ${c.type==='benefit'?'b':'c'}">${c.type}</span>
        </div>
        <div style="font-size:11.5px;color:var(--ink-3)">${c.desc} · ${c.unit}</div>
        <input type="range" min="1" max="30" value="${Math.round(c.w*100)}" data-j="${j}" oninput="editWeight(this)" style="width:100%;margin-top:9px;accent-color:var(--teal)">
      </div>
      <div style="text-align:right;min-width:64px">
        <div class="mono" style="font-size:19px;font-weight:600;color:var(--teal-d)">${f2(W[j])}</div>
        <div style="font-size:10.5px;color:var(--ink-3)">${(W[j]*100).toFixed(0)}%</div>
      </div>
    </div>`).join('');
  document.getElementById('wsum').textContent='Σ bobot = 1,00';
  renderDonut(W);
}
function editWeight(el){CRIT[+el.dataset.j].w=(+el.value)/100; renderAll(false);}
function renderDonut(W){
  const cols=['#0E7C6B','#2E6BB0','#E08A2B','#7A52B0','#D64545'];
  let acc=0,segs='';const R=52,C=2*Math.PI*R;
  W.forEach((w,j)=>{const len=w*C;segs+=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${cols[j%5]}" stroke-width="20" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"/>`;acc+=len;});
  document.getElementById('donut').innerHTML=`
    <div style="display:flex;align-items:center;gap:18px">
      <svg width="140" height="140" viewBox="0 0 140 140">${segs}
        <text x="70" y="66" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="22" fill="var(--ink)">${CRIT.length}</text>
        <text x="70" y="84" text-anchor="middle" font-family="Inter" font-size="10" fill="var(--ink-3)">kriteria</text></svg>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${CRIT.map((c,j)=>`<div style="display:flex;align-items:center;gap:8px;font-size:12px"><i style="width:11px;height:11px;border-radius:3px;background:${cols[j%5]}"></i><b style="font-family:Plus Jakarta Sans;font-size:12px">${c.code}</b><span style="color:var(--ink-3)">${(W[j]*100).toFixed(0)}%</span></div>`).join('')}
      </div></div>`;
}

/* ===================== RENDER: HASIL ===================== */
let curMethod='saw';
function renderHasil(){
  const data = curMethod==='saw'?computeSAW():computeTOPSIS();
  const rk=ranked(data.V);
  const w=patients[rk[0].i];
  document.getElementById('winnerBox').innerHTML=`
    <div class="winner-card">
      <div class="pav">${initials(w.name)}</div>
      <div><b>Prioritas #1 — ${w.name}</b><span>Direkomendasikan untuk penanganan intensif lebih dahulu · Metode ${curMethod.toUpperCase()}</span></div>
      <div class="v"><div class="big">${rk[0].v.toFixed(3)}</div><small>nilai preferensi (V)</small></div>
    </div>`;
  document.getElementById('methodBody').innerHTML = curMethod==='saw'?sawSteps(data,rk):topsisSteps(data,rk);
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
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Pasien</th>${cl.map((c,j)=>`<th class="num">${c}×${f2(d.W[j])}</th>`).join('')}<th class="num">V</th><th>Prioritas</th></tr></thead><tbody>
    ${rk.map((r,idx)=>{const p=patients[r.i],pl=priorityLevel(idx,patients.length);
      return `<tr><td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color}">${initials(p.name)}</div><b style="font-size:13px">${p.name}</b></div></td>
      ${d.R[r.i].map((v,j)=>`<td class="num" style="color:var(--ink-3)">${f(v*d.W[j])}</td>`).join('')}
      <td class="num"><b style="font-size:14px;color:var(--teal-d)">${r.v.toFixed(4)}</b></td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}">${pl.lbl}</span></td></tr>`;}).join('')}
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
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>#</th><th>Pasien</th><th class="num">D⁺ (jarak ideal)</th><th class="num">D⁻ (jarak anti-ideal)</th><th class="num">V preferensi</th><th>Prioritas</th></tr></thead><tbody>
    ${rk.map((r,idx)=>{const p=patients[r.i],pl=priorityLevel(idx,patients.length);
      return `<tr><td><span class="rank-badge" style="background:${pl.col}">${idx+1}</span></td>
      <td><div class="patient-cell"><div class="pav" style="width:28px;height:28px;font-size:11px;background:${p.color}">${initials(p.name)}</div><b style="font-size:13px">${p.name}</b></div></td>
      <td class="num">${f(d.Dp[r.i])}</td><td class="num">${f(d.Dm[r.i])}</td>
      <td class="num"><b style="font-size:14px;color:var(--teal-d)">${r.v.toFixed(4)}</b></td>
      <td><span class="pchip" style="background:${pl.soft};color:${pl.col}">${pl.lbl}</span></td></tr>`;}).join('')}
    </tbody></table></div></div></div>`;
  return html;
}

/* ===================== RENDER: COMPARE ===================== */
function renderCompare(){
  const s=computeSAW(), t=computeTOPSIS();
  const rs=ranked(s.V), rt=ranked(t.V);
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
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"/></svg>
     <div><b>Rekomendasi sistem:</b> ${sameTop
        ?`Kedua metode sepakat menempatkan <b>${patients[rs[0].i].name}</b> sebagai prioritas tertinggi, sehingga keputusan ini sangat kuat dan dapat langsung ditindaklanjuti.`
        :`SAW memilih <b>${patients[rs[0].i].name}</b> sedangkan TOPSIS memilih <b>${patients[rt[0].i].name}</b>. Karena TOPSIS lebih menghargai keseimbangan profil risiko, sistem menyarankan <b>${patients[rt[0].i].name}</b> sebagai prioritas utama, dengan ${patients[rs[0].i].name} sebagai prioritas berikutnya.`}</div>
   </div>`;
  document.getElementById('compareBody').innerHTML=html;
}
