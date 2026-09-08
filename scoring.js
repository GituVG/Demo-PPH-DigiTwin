/* Scoring engine. Each entry is one clinical signal: which window it belongs
   to, how to describe its current value, and how many illustrative points it
   contributes when abnormal. This is a simplified, illustrative weighting for
   demonstration — not a validated clinical risk model. */

const FACTOR_DEFS = [
  { id:'ap_hgb', win:'ap', label:'Antepartum anemia', time:'Antepartum · 28-week labs',
    detail:v=>'Hemoglobin '+v.ap_hgb.toFixed(1)+' g/dL',
    calc:v=> v.ap_hgb<10 ? Math.min(8,(10-v.ap_hgb)*4) : 0 },
  { id:'ap_plt', win:'ap', label:'Low platelets', time:'Antepartum · 28-week labs',
    detail:v=>'Platelets '+v.ap_plt+' x10^9/L',
    calc:v=> v.ap_plt<100 ? 10 : 0 },
  { id:'ap_fib', win:'ap', label:'Antepartum hypofibrinogenemia', time:'Antepartum · 28-week labs',
    detail:v=>'Fibrinogen '+v.ap_fib+' mg/dL',
    calc:v=> v.ap_fib<200 ? 12 : 0 },
  { id:'ap_bmi', win:'ap', label:'Elevated BMI', time:'Antepartum · intake',
    detail:v=>'BMI '+v.ap_bmi,
    calc:v=> v.ap_bmi>35 ? 5 : 0 },
  { id:'ap_priorpph', win:'ap', label:'Prior PPH history', time:'Antepartum · history',
    detail:v=>'Prior PPH: '+(v.ap_priorpph==='1'?'yes':'no'),
    calc:v=> v.ap_priorpph==='1' ? 15 : 0 },
  { id:'ap_multi', win:'ap', label:'Multiple gestation', time:'Antepartum · history',
    detail:v=>'Multiple gestation: '+(v.ap_multi==='1'?'yes':'no'),
    calc:v=> v.ap_multi==='1' ? 10 : 0 },
  { id:'ap_placenta', win:'ap', label:'Placental abnormality', time:'Antepartum · anatomy scan',
    detail:v=>'Placenta: '+v.ap_placenta,
    calc:v=> v.ap_placenta==='accreta' ? 25 : v.ap_placenta==='previa' ? 15 : 0 },

  { id:'ip_labor', win:'ip', label:'Prolonged labor', time:'Intrapartum · admission',
    detail:v=>'Labor duration '+v.ip_labor+' h',
    calc:v=> v.ip_labor>18 ? 8 : 0 },
  { id:'ip_mode', win:'ip', label:'Operative/instrumental delivery', time:'Intrapartum · delivery',
    detail:v=>'Mode of delivery: '+({vag:'vaginal',instr:'instrumental',cs:'cesarean'})[v.ip_mode],
    calc:v=> v.ip_mode==='cs' ? 10 : v.ip_mode==='instr' ? 8 : 0 },
  { id:'ip_oxytocin', win:'ip', label:'Oxytocin augmentation', time:'Intrapartum · labor mgmt',
    detail:v=>'Oxytocin augmentation: '+(v.ip_oxytocin==='1'?'yes':'no'),
    calc:v=> v.ip_oxytocin==='1' ? 5 : 0 },
  { id:'ip_chorio', win:'ip', label:'Chorioamnionitis', time:'Intrapartum · labor mgmt',
    detail:v=>'Chorioamnionitis: '+(v.ip_chorio==='1'?'yes':'no'),
    calc:v=> v.ip_chorio==='1' ? 10 : 0 },
  { id:'ip_ebl', win:'ip', label:'Elevated delivery EBL', time:'Intrapartum · delivery',
    detail:v=>'EBL at delivery '+v.ip_ebl+' mL',
    calc:v=> v.ip_ebl>500 ? Math.min(15, Math.floor((v.ip_ebl-500)/100)*3) : 0 },

  { id:'pp_vitals', win:'pp', label:'Elevated shock index', time:'Immediate PP · 1h vitals',
    detail:v=>'HR '+v.pp_hr+', SBP '+v.pp_sbp,
    calc:v=>{ const si=v.pp_hr/v.pp_sbp; return si>1.1?25 : si>0.9?15 : 0; } },
  { id:'pp_tone', win:'pp', label:'Uterine atony', time:'Immediate PP · 1h exam',
    detail:v=>'Fundal tone: '+v.pp_tone,
    calc:v=> v.pp_tone==='atonic' ? 20 : 0 },
  { id:'pp_fib', win:'pp', label:'Postpartum hypofibrinogenemia', time:'Immediate PP · 2h labs',
    detail:v=>'Fibrinogen '+v.pp_fib+' mg/dL',
    calc:v=> v.pp_fib<200 ? 15 : 0 },
  { id:'pp_lactate', win:'pp', label:'Elevated lactate', time:'Immediate PP · 2h labs',
    detail:v=>'Lactate '+v.pp_lactate.toFixed(1)+' mmol/L',
    calc:v=> v.pp_lactate>4 ? 10 : 0 },
  { id:'pp_ebl_cum', win:'pp', label:'High cumulative EBL', time:'Immediate PP · 4h',
    detail:v=>'Cumulative EBL '+v.pp_ebl_cum+' mL',
    calc:v=> v.pp_ebl_cum>1500 ? 25 : v.pp_ebl_cum>1000 ? 15 : 0 },

  { id:'ext_hgbdrop', win:'ext', label:'Significant Hgb drop', time:'Extended PP · day 3 labs',
    detail:v=>'Hemoglobin drop '+v.ext_hgbdrop.toFixed(1)+' g/dL',
    calc:v=> v.ext_hgbdrop>3 ? 10 : 0 },
  { id:'ext_retained', win:'ext', label:'Retained products', time:'Extended PP · ultrasound',
    detail:v=>'Retained products: '+(v.ext_retained==='1'?'yes':'no'),
    calc:v=> v.ext_retained==='1' ? 20 : 0 },
  { id:'ext_subinvolution', win:'ext', label:'Uterine subinvolution', time:'Extended PP · exam',
    detail:v=>'Uterine subinvolution: '+(v.ext_subinvolution==='1'?'yes':'no'),
    calc:v=> v.ext_subinvolution==='1' ? 10 : 0 },
  { id:'ext_delayed', win:'ext', label:'Delayed bleeding episode', time:'Extended PP · new bleeding',
    detail:v=>'Delayed bleeding episode: '+(v.ext_delayed==='1'?'yes':'no'),
    calc:v=> v.ext_delayed==='1' ? 20 : 0 },
  { id:'ext_mtdna', win:'ext', label:'Elevated cell-free mtDNA', time:'Extended PP · biomarker panel',
    detail:v=>'Cell-free mtDNA '+v.ext_mtdna.toFixed(1)+'x baseline',
    calc:v=> v.ext_mtdna>2 ? 15 : 0 }
];

function tierOf(score){
  if(score<20) return 'Low';
  if(score<45) return 'Moderate';
  if(score<70) return 'High';
  return 'Critical';
}

/* activeIds: optional array of FACTOR_DEFS ids to restrict scoring to
   (used by time-lapse to reveal factors progressively). Omit for "all". */
function computeScore(vals, activeIds){
  const defs = activeIds ? FACTOR_DEFS.filter(d=>activeIds.includes(d.id)) : FACTOR_DEFS;
  const raw = defs.reduce((sum,d)=> sum + d.calc(vals), 0);
  return Math.min(100, Math.round(raw));
}

function computeFactorList(vals, activeIds){
  const defs = activeIds ? FACTOR_DEFS.filter(d=>activeIds.includes(d.id)) : FACTOR_DEFS;
  return defs
    .map(d=>({ label:d.label, points:d.calc(vals) }))
    .filter(f=>f.points>0)
    .sort((a,b)=>b.points-a.points);
}

function windowSubtotal(vals, winKey, activeIds){
  const defs = (activeIds ? FACTOR_DEFS.filter(d=>activeIds.includes(d.id)) : FACTOR_DEFS)
    .filter(d=>d.win===winKey);
  return defs.reduce((sum,d)=> sum + d.calc(vals), 0);
}

function tierBadgeClass(tier){ return 'tier-badge tier-'+tier; }
