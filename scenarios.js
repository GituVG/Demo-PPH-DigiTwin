function buildScenarios(root){
  root.innerHTML = `
    <div id="scPick">
      <div class="scenario-grid" id="scGrid"></div>
    </div>
    <div id="scPredict" style="display:none">
      <div class="vignette-box">
        <p class="tag" id="scTag"></p>
        <p id="scVignette"></p>
      </div>
      <p style="font-size:0.88rem;color:var(--muted);margin-bottom:0.6rem">What's your predicted risk tier?</p>
      <div class="guess-row" id="scGuess">
        <button class="guess-btn" data-tier="Low">Low</button>
        <button class="guess-btn" data-tier="Moderate">Moderate</button>
        <button class="guess-btn" data-tier="High">High</button>
        <button class="guess-btn" data-tier="Critical">Critical</button>
      </div>
    </div>
    <div id="scReveal" style="display:none">
      <div id="scFeedback" class="feedback-banner"></div>
      <div class="win-tabs" id="scTabs"></div>
      <div class="subtotal-row" id="scSubtotals"></div>
      <div id="scPanels"></div>
      <div class="score-panel">
        <div>
          <div class="score-label">Composite risk score</div>
          <div class="score-num" id="scScore">0</div>
        </div>
        <div class="tier-badge" id="scTierBadge"></div>
        <button class="ctrl-btn" id="scAnother" style="margin-left:auto">Try another scenario</button>
      </div>
      <div id="scFactors"></div>
    </div>
  `;

  const gridEl = root.querySelector('#scGrid');
  gridEl.innerHTML = SCENARIOS.map(s=>
    `<button class="scenario-card" data-id="${s.id}">
      <div class="t">${s.title}</div>
      <div class="s">Tap to view vignette</div>
    </button>`
  ).join('');

  let current = null, predicted = null;
  const vals = {};

  function showStep(step){
    root.querySelector('#scPick').style.display = step==='pick' ? 'block' : 'none';
    root.querySelector('#scPredict').style.display = step==='predict' ? 'block' : 'none';
    root.querySelector('#scReveal').style.display = step==='reveal' ? 'block' : 'none';
  }

  gridEl.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    current = SCENARIOS.find(s=>s.id===b.dataset.id);
    predicted = null;
    root.querySelector('#scTag').textContent = current.title;
    root.querySelector('#scVignette').textContent = current.vignette;
    showStep('predict');
  }));

  const tabsEl = root.querySelector('#scTabs');
  tabsEl.innerHTML = WINDOWS.map((w,i)=>
    `<button data-win="${w.key}" class="${i===0?'is-active':''}">${w.label}</button>`
  ).join('');
  const panelsEl = root.querySelector('#scPanels');
  panelsEl.innerHTML = WINDOWS.map((w,i)=>{
    const rows = VARIABLES.filter(v=>v.win===w.key).map(v=>{
      if(v.type==='range'){
        return `<div class="row">
          <label>${v.label}</label>
          <input type="range" id="sc_${v.id}" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.default}">
          <span class="out" id="sc_${v.id}_o">${v.default}</span>
        </div>`;
      }
      const opts = v.options.map(([val,lbl])=>`<option value="${val}">${lbl}</option>`).join('');
      return `<div class="row"><label>${v.label}</label><select id="sc_${v.id}">${opts}</select></div>`;
    }).join('');
    return `<div class="sc-panel" data-win="${w.key}" style="display:${i===0?'block':'none'}">${rows}</div>`;
  }).join('');
  tabsEl.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    tabsEl.querySelectorAll('button').forEach(x=>x.classList.remove('is-active'));
    b.classList.add('is-active');
    panelsEl.querySelectorAll('.sc-panel').forEach(p=>{
      p.style.display = (p.dataset.win===b.dataset.win) ? 'block' : 'none';
    });
  }));

  function readVals(){
    VARIABLES.forEach(v=>{
      const el = document.getElementById('sc_'+v.id);
      vals[v.id] = v.type==='range' ? parseFloat(el.value) : el.value;
    });
  }

  function renderReveal(){
    readVals();
    const score = computeScore(vals);
    const tier = tierOf(score);
    root.querySelector('#scScore').textContent = score;
    const badge = root.querySelector('#scTierBadge');
    badge.textContent = tier + ' risk';
    badge.className = tierBadgeClass(tier);

    if(predicted){
      const fb = root.querySelector('#scFeedback');
      const correct = predicted === tier;
      fb.className = 'feedback-banner ' + (correct ? 'correct' : 'incorrect');
      fb.innerHTML = correct
        ? `<strong>Correct.</strong> You predicted ${predicted} risk — the composite score of ${score} confirms it.`
        : `<strong>Not quite.</strong> You predicted ${predicted}, but the composite score of ${score} places this case in the ${tier} tier. Check the contributing factors below.`;
    }

    const factors = computeFactorList(vals).slice(0,6);
    const max = factors.length ? factors[0].points : 1;
    root.querySelector('#scFactors').innerHTML = factors.length ? factors.map(f=>
      `<div class="factor-row">
        <div class="fname">${f.label}</div>
        <div class="factor-track"><div class="factor-fill" style="width:${(f.points/max*100).toFixed(0)}%"></div></div>
        <div class="factor-pts">${Math.round(f.points)}</div>
      </div>`).join('') : '<p class="empty-note">No elevated risk factors present.</p>';

    const subMax = Math.max(1, ...WINDOWS.map(w=>windowSubtotal(vals,w.key)));
    root.querySelector('#scSubtotals').innerHTML = WINDOWS.map(w=>{
      const sub = windowSubtotal(vals,w.key);
      return `<div class="subtotal-item">
        <div class="label">${w.label}</div>
        <div class="subtotal-track"><div class="subtotal-fill" style="width:${(sub/subMax*100).toFixed(0)}%"></div></div>
      </div>`;
    }).join('');
  }

  root.querySelector('#scGuess').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    predicted = b.dataset.tier;
    VARIABLES.forEach(v=>{
      const el = document.getElementById('sc_'+v.id);
      el.value = current.vals[v.id];
      const out = document.getElementById('sc_'+v.id+'_o');
      if(out) out.textContent = v.step<1 ? parseFloat(el.value).toFixed(1) : el.value;
    });
    showStep('reveal');
    renderReveal();
  }));

  panelsEl.querySelectorAll('input[type=range]').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const id = inp.id.replace(/^sc_/,'');
      const v = VARIABLES.find(x=>x.id===id);
      const out = document.getElementById(inp.id+'_o');
      out.textContent = v.step<1 ? parseFloat(inp.value).toFixed(1) : inp.value;
      renderReveal();
    });
  });
  panelsEl.querySelectorAll('select').forEach(s=>s.addEventListener('change',renderReveal));

  root.querySelector('#scAnother').addEventListener('click',()=>{
    current = null; predicted = null;
    showStep('pick');
  });
}
