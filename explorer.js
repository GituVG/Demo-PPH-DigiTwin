function buildExplorer(root){
  const vals = {};
  VARIABLES.forEach(v=>{ vals[v.id] = v.default; });

  root.innerHTML = `
    <div class="win-tabs" id="exTabs"></div>
    <div class="subtotal-row" id="exSubtotals"></div>
    <div id="exPanels"></div>
    <div class="score-panel">
      <div>
        <div class="score-label">Composite risk score</div>
        <div class="score-num" id="exScore">0</div>
      </div>
      <div class="tier-badge" id="exTier"></div>
    </div>
    <div id="exFactors"></div>
  `;

  const tabsEl = root.querySelector('#exTabs');
  tabsEl.innerHTML = WINDOWS.map((w,i)=>
    `<button data-win="${w.key}" class="${i===0?'is-active':''}">${w.label}</button>`
  ).join('');

  const panelsEl = root.querySelector('#exPanels');
  panelsEl.innerHTML = WINDOWS.map((w,i)=>{
    const rows = VARIABLES.filter(v=>v.win===w.key).map(v=>{
      if(v.type==='range'){
        return `<div class="row">
          <label>${v.label}</label>
          <input type="range" id="${v.id}" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.default}">
          <span class="out" id="${v.id}_o">${v.step<1 ? v.default.toFixed(1) : v.default}</span>
        </div>`;
      }
      const opts = v.options.map(([val,lbl])=>`<option value="${val}" ${val===v.default?'selected':''}>${lbl}</option>`).join('');
      return `<div class="row"><label>${v.label}</label><select id="${v.id}">${opts}</select></div>`;
    }).join('');
    return `<div class="ex-panel" data-win="${w.key}" style="display:${i===0?'block':'none'}">${rows}</div>`;
  }).join('');

  tabsEl.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    tabsEl.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));
    b.classList.add('is-active');
    panelsEl.querySelectorAll('.ex-panel').forEach(p=>{
      p.style.display = (p.dataset.win===b.dataset.win) ? 'block' : 'none';
    });
  }));

  function readVals(){
    VARIABLES.forEach(v=>{
      const el = document.getElementById(v.id);
      vals[v.id] = v.type==='range' ? parseFloat(el.value) : el.value;
    });
  }

  function render(){
    readVals();
    const score = computeScore(vals);
    const tier = tierOf(score);
    root.querySelector('#exScore').textContent = score;
    const badge = root.querySelector('#exTier');
    badge.textContent = tier + ' risk';
    badge.className = tierBadgeClass(tier);

    const factors = computeFactorList(vals).slice(0,6);
    const max = factors.length ? factors[0].points : 1;
    root.querySelector('#exFactors').innerHTML = factors.length ? factors.map(f=>
      `<div class="factor-row">
        <div class="fname">${f.label}</div>
        <div class="factor-track"><div class="factor-fill" style="width:${(f.points/max*100).toFixed(0)}%"></div></div>
        <div class="factor-pts">${Math.round(f.points)}</div>
      </div>`).join('') : '<p class="empty-note">No elevated risk factors present.</p>';

    const subMax = Math.max(1, ...WINDOWS.map(w=>windowSubtotal(vals,w.key)));
    root.querySelector('#exSubtotals').innerHTML = WINDOWS.map(w=>{
      const sub = windowSubtotal(vals,w.key);
      return `<div class="subtotal-item">
        <div class="label">${w.label}</div>
        <div class="subtotal-track"><div class="subtotal-fill" style="width:${(sub/subMax*100).toFixed(0)}%"></div></div>
      </div>`;
    }).join('');
  }

  panelsEl.querySelectorAll('input[type=range]').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const v = VARIABLES.find(x=>x.id===inp.id);
      const out = document.getElementById(inp.id+'_o');
      out.textContent = v.step<1 ? parseFloat(inp.value).toFixed(1) : inp.value;
      render();
    });
  });
  panelsEl.querySelectorAll('select').forEach(s=>s.addEventListener('change',render));

  render();
}
