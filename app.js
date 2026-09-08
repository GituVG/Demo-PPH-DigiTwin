document.addEventListener('DOMContentLoaded', () => {

  // --- Section navigation ---
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  navItems.forEach(btn => btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    sections.forEach(s => s.classList.toggle('is-active', s.id === btn.dataset.section));
  }));

  // --- Build the three interactive modes ---
  buildExplorer(document.getElementById('explorerRoot'));
  buildScenarios(document.getElementById('scenariosRoot'));
  buildTimelapse(document.getElementById('timelapseRoot'));

  // --- Hero mini-loop: a quiet, continuously replaying trajectory ---
  const heroScenario = SCENARIOS.find(s => s.id === 's4'); // acute atony — the most legible arc
  const trajectory = computeTrajectory(heroScenario.vals);
  const line = document.getElementById('heroLine');
  const dot = document.getElementById('heroDot');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pointXY(idx, score){
    const x = 30 + idx/21*320;
    const y = 190 - (score/100*180);
    return [x,y];
  }

  if(reduceMotion){
    const pts = trajectory.map((s,i)=>pointXY(i,s));
    line.setAttribute('points', pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '));
    const [lx,ly] = pts[pts.length-1];
    dot.setAttribute('cx', lx); dot.setAttribute('cy', ly);
  } else {
    let i = -1;
    setInterval(() => {
      i++;
      if(i > 21){ i = -1; line.setAttribute('points',''); return; }
      const pts = [];
      for(let j=0;j<=i;j++) pts.push(pointXY(j, trajectory[j]));
      line.setAttribute('points', pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '));
      const [dx,dy] = pointXY(i, trajectory[i]);
      dot.setAttribute('cx', dx); dot.setAttribute('cy', dy);
    }, 350);
  }
});
