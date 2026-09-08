/* Returns the cumulative score at each of the 22 factor-reveal steps for a
   given set of patient values. Shared with the Overview hero mini-loop. */
function computeTrajectory(vals){
  const out = [];
  for(let i=0;i<FACTOR_DEFS.length;i++){
    const ids = FACTOR_DEFS.slice(0,i+1).map(d=>d.id);
    out.push(computeScore(vals, ids));
  }
  return out;
}

function buildTimelapse(root){
  root.innerHTML = `
    <div class="scenario-grid" id="tlGrid"></div>
    <div class="playback-row">
      <button class="ctrl-btn" id="tlPlay">Play</button>
      <button class="ctrl-btn" id="tlRestart">Restart</button>
      <select id="tlSpeed">
        <option value="1400">0.5x</option>
        <option value="700" selected>1x</option>
        <option value="350">2x</option>
      </select>
      <span class="step-counter" id="tlCounter">Step 0 of 22</span>
    </div>
    <input type="range" class="scrub" id="tlScrub" min="0" max="21" step="1" value="0">
    <div class="win-strip" id="tlWinStrip"></div>
    <svg class="tl-chart" viewBox="0 0 640 200" id="tlSvg">
      <rect x="60" y="10" width="560" height="36" fill="var(--tier-critical)" opacity="0.14"></rect>
      <rect x="60" y="46" width="560" height="45" fill="var(--tier-high)" opacity="0.14"></rect>
      <rect x="60" y="91" width="560" height="45" fill="var(--tier-moderate)" opacity="0.14"></rect>
      <rect x="60" y="136" width="560" height="54" fill="var(--tier-low)" opacity="0.14"></rect>
      <text x="55" y="30" text-anchor="end" font-size="11" fill="var(--muted)">100</text>
      <text x="55" y="94" text-anchor="end" font-size="11" fill="var(--muted)">45</text>
      <text x="55" y="139" text-anchor="end" font-size="11" fill="var(--muted)">20</text>
      <text x="55" y="188" text-anchor="end" font-size="11" fill="var(--muted)">0</text>
      <polyline id="tlLine" fill="none" stroke="var(--ink)" stroke-width="2" points=""></polyline>
      <circle id="tlDot" cx="60" cy="190" r="6" fill="var(--ink)"></circle>
    </svg>
    <div class="caption-box">
      <p class="time" id="tlTime">Select a scenario to begin</p>
      <p class="title" id="tlTitle"></p>
    </div>
    <div class="score-panel">
      <div>
        <div class="score-label">Composite risk score</div>
        <div class="score-num" id="tlScore">0</div>
      </div>
      <div class="tier-badge" id="tlTier"></div>
    </div>
    <div id="tlFactors"></div>
  `;

  root.querySelector('#tlGrid').innerHTML = SCENARIOS.map(s=>
    `<button class="scenario-card" data-id="${s.id}"><div class="t">${s.title}</div></button>`
  ).join('');
  root.querySelector('#tlWinStrip').innerHTML = WINDOWS.map(w=>
    `<div class="w" data-win="${w.key}">${w.label}</div>`
  ).join('');

  let vals = null, step = -1, playing = false, timer = null;

  function pointXY(idx, score){
    const x = 60 + idx/21*560;
    const y = 190 - (score/100*180);
    return [x,y];
  }

  function render(){
    if(!vals) return;
    const trajectory = computeTrajectory(vals);
    const pts = [];
    for(let i=0;i<=Math.max(step,-1);i++){
      if(step<0) break;
      pts.push(pointXY(i, trajectory[i]));
    }
    root.querySelector('#tlLine').setAttribute('points', pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '));
    const score = step>=0 ? trajectory[step] : 0;
    const tier = tierOf(score);
    root.querySelector('#tlScore').textContent = score;
    const badge = root.querySelector('#tlTier');
    badge.textContent = tier + ' risk';
    badge.className = tierBadgeClass(tier);

    const dot = root.querySelector('#tlDot');
    const [dx,dy] = step>=0 ? pointXY(step, score) : [60,190];
    dot.setAttribute('cx', dx); dot.setAttribute('cy', dy);

    root.querySelector('#tlCounter').textContent = 'Step ' + (step+1) + ' of ' + FACTOR_DEFS.length;
    root.querySelectorAll('#tlWinStrip .w').forEach(el=>{
      el.classList.toggle('is-current', step>=0 && FACTOR_DEFS[step].win===el.dataset.win);
    });

    if(step>=0){
      const def = FACTOR_DEFS[step];
      const pts_ = def.calc(vals);
      root.querySelector('#tlTime').textContent = def.time;
      root.querySelector('#tlTitle').textContent = def.detail(vals) + (pts_>0 ? ' — adds '+Math.round(pts_)+' pts' : ' — within normal range');
    }

    const activeIds = step>=0 ? FACTOR_DEFS.slice(0,step+1).map(d=>d.id) : [];
    const factors = computeFactorList(vals, activeIds).slice(0,6);
    const max = factors.length ? factors[0].points : 1;
    root.querySelector('#tlFactors').innerHTML = factors.length ? factors.map(f=>
      `<div class="factor-row">
        <div class="fname">${f.label}</div>
        <div class="factor-track"><div class="factor-fill" style="width:${(f.points/max*100).toFixed(0)}%"></div></div>
        <div class="factor-pts">${Math.round(f.points)}</div>
      </div>`).join('') : '<p class="empty-note">No elevated risk factors present.</p>';
  }

  function loadScenario(s){
    vals = s.vals; step = -1;
    root.querySelector('#tlScrub').value = 0;
    render();
    root.querySelector('#tlTime').textContent = 'Ready';
    root.querySelector('#tlTitle').textContent = 'Press play to start the time-lapse.';
  }
  root.querySelector('#tlGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    pause(); loadScenario(SCENARIOS.find(s=>s.id===b.dataset.id));
  }));

  function stepForward(){
    if(step>=21){ pause(); return; }
    step++;
    root.querySelector('#tlScrub').value = step;
    render();
  }
  function play(){
    if(!vals) return;
    if(step>=21) step=-1;
    playing = true;
    root.querySelector('#tlPlay').textContent = 'Pause';
    timer = setInterval(stepForward, parseInt(root.querySelector('#tlSpeed').value));
  }
  function pause(){
    playing = false;
    clearInterval(timer);
    root.querySelector('#tlPlay').textContent = 'Play';
  }
  root.querySelector('#tlPlay').addEventListener('click',()=> playing ? pause() : play());
  root.querySelector('#tlRestart').addEventListener('click',()=>{
    pause(); step=-1; root.querySelector('#tlScrub').value=0; render();
  });
  root.querySelector('#tlScrub').addEventListener('input',(e)=>{
    pause(); step = parseInt(e.target.value); render();
  });
  root.querySelector('#tlSpeed').addEventListener('change',()=>{
    if(playing){ clearInterval(timer); timer = setInterval(stepForward, parseInt(root.querySelector('#tlSpeed').value)); }
  });
}
