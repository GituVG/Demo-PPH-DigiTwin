/* Shared data used across explorer, scenarios, and time-lapse modules. */

const WINDOWS = [
  { key: 'ap',  label: 'Antepartum' },
  { key: 'ip',  label: 'Intrapartum' },
  { key: 'pp',  label: 'Immediate postpartum' },
  { key: 'ext', label: 'Extended postpartum' }
];

/* Controls rendered in the Explorer. pp_hr and pp_sbp are shown separately
   here but scored jointly as a single shock-index factor (see scoring.js). */
const VARIABLES = [
  { id: 'ap_hgb',      win: 'ap',  label: 'Hemoglobin (g/dL)',        type: 'range',  min: 6,   max: 15,   step: 0.1, default: 12 },
  { id: 'ap_plt',      win: 'ap',  label: 'Platelets (x10^9/L)',      type: 'range',  min: 30,  max: 450,  step: 5,   default: 220 },
  { id: 'ap_fib',      win: 'ap',  label: 'Fibrinogen (mg/dL)',       type: 'range',  min: 100, max: 600,  step: 10,  default: 350 },
  { id: 'ap_bmi',      win: 'ap',  label: 'BMI',                      type: 'range',  min: 18,  max: 45,   step: 1,   default: 26 },
  { id: 'ap_priorpph', win: 'ap',  label: 'Prior PPH',                type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ap_multi',    win: 'ap',  label: 'Multiple gestation',       type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ap_placenta', win: 'ap',  label: 'Placenta',                 type: 'select', options: [['none','Normal'],['previa','Previa'],['accreta','Accreta spectrum']], default: 'none' },

  { id: 'ip_labor',    win: 'ip',  label: 'Labor duration (h)',       type: 'range',  min: 1,   max: 24,   step: 1,   default: 8 },
  { id: 'ip_mode',     win: 'ip',  label: 'Mode of delivery',         type: 'select', options: [['vag','Vaginal'],['instr','Instrumental'],['cs','Cesarean']], default: 'vag' },
  { id: 'ip_oxytocin', win: 'ip',  label: 'Oxytocin augmentation',    type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ip_chorio',   win: 'ip',  label: 'Chorioamnionitis',         type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ip_ebl',      win: 'ip',  label: 'EBL at delivery (mL)',     type: 'range',  min: 100, max: 2000, step: 50,  default: 300 },

  { id: 'pp_hr',       win: 'pp',  label: 'Heart rate (bpm)',         type: 'range',  min: 50,  max: 160,  step: 1,   default: 85 },
  { id: 'pp_sbp',      win: 'pp',  label: 'Systolic BP (mmHg)',       type: 'range',  min: 70,  max: 160,  step: 1,   default: 115 },
  { id: 'pp_tone',     win: 'pp',  label: 'Fundal tone',              type: 'select', options: [['firm','Firm'],['atonic','Atonic']], default: 'firm' },
  { id: 'pp_fib',      win: 'pp',  label: 'Fibrinogen (mg/dL)',       type: 'range',  min: 100, max: 600,  step: 10,  default: 300 },
  { id: 'pp_lactate',  win: 'pp',  label: 'Lactate (mmol/L)',         type: 'range',  min: 0.5, max: 8,    step: 0.1, default: 1.5 },
  { id: 'pp_ebl_cum',  win: 'pp',  label: 'Cumulative EBL (mL)',      type: 'range',  min: 200, max: 2500, step: 50,  default: 400 },

  { id: 'ext_hgbdrop',       win: 'ext', label: 'Hgb drop from baseline',     type: 'range',  min: 0,   max: 6, step: 0.1, default: 1 },
  { id: 'ext_retained',      win: 'ext', label: 'Retained products',         type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ext_subinvolution', win: 'ext', label: 'Uterine subinvolution',     type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ext_delayed',       win: 'ext', label: 'Delayed bleeding episode',  type: 'select', options: [['0','No'],['1','Yes']], default: '0' },
  { id: 'ext_mtdna',         win: 'ext', label: 'Cell-free mtDNA (x baseline)', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1 }
];

/* Five preset patient cases spanning the tier range, each driven mainly by a
   different window so the model's four-window structure is visible in the data. */
const SCENARIOS = [
  { id: 's1', title: 'Uncomplicated term delivery',
    vignette: '28-year-old, G2P1, term spontaneous vaginal delivery. Labor 6 hours, no augmentation. Normal antepartum labs. Stable vitals postpartum, EBL 300 mL.',
    vals: { ap_hgb:12.5, ap_plt:240, ap_fib:380, ap_bmi:24, ap_priorpph:'0', ap_multi:'0', ap_placenta:'none', ip_labor:6, ip_mode:'vag', ip_oxytocin:'0', ip_chorio:'0', ip_ebl:250, pp_hr:78, pp_sbp:118, pp_tone:'firm', pp_fib:320, pp_lactate:1.2, pp_ebl_cum:300, ext_hgbdrop:0.5, ext_retained:'0', ext_subinvolution:'0', ext_delayed:'0', ext_mtdna:0.9 } },
  { id: 's2', title: 'Prolonged second stage, instrumental delivery',
    vignette: '22-year-old, G1P0, prolonged second stage requiring vacuum-assisted vaginal delivery with oxytocin augmentation. EBL 450 mL at delivery.',
    vals: { ap_hgb:12, ap_plt:230, ap_fib:340, ap_bmi:25, ap_priorpph:'0', ap_multi:'0', ap_placenta:'none', ip_labor:19, ip_mode:'instr', ip_oxytocin:'1', ip_chorio:'0', ip_ebl:450, pp_hr:90, pp_sbp:110, pp_tone:'firm', pp_fib:280, pp_lactate:2.5, pp_ebl_cum:700, ext_hgbdrop:1.2, ext_retained:'0', ext_subinvolution:'0', ext_delayed:'0', ext_mtdna:1.1 } },
  { id: 's3', title: 'Suspected placenta accreta spectrum',
    vignette: '35-year-old, G3P2, antenatal imaging suspicious for placenta accreta spectrum, scheduled cesarean. Baseline hemoglobin 9.0 g/dL, platelets 90, fibrinogen 180 mg/dL.',
    vals: { ap_hgb:9.0, ap_plt:90, ap_fib:180, ap_bmi:27, ap_priorpph:'0', ap_multi:'0', ap_placenta:'accreta', ip_labor:2, ip_mode:'cs', ip_oxytocin:'0', ip_chorio:'0', ip_ebl:600, pp_hr:88, pp_sbp:112, pp_tone:'firm', pp_fib:250, pp_lactate:1.8, pp_ebl_cum:650, ext_hgbdrop:1.0, ext_retained:'0', ext_subinvolution:'0', ext_delayed:'0', ext_mtdna:1.0 } },
  { id: 's4', title: 'Acute atony with hemorrhagic shock',
    vignette: '29-year-old, G1P1, vaginal delivery, oxytocin-augmented labor. Two hours postpartum: HR 130, SBP 85, uterus atonic and poorly responsive to massage, fibrinogen 170, lactate 5.5, EBL climbing to 1800 mL.',
    vals: { ap_hgb:12, ap_plt:210, ap_fib:330, ap_bmi:25, ap_priorpph:'0', ap_multi:'0', ap_placenta:'none', ip_labor:8, ip_mode:'vag', ip_oxytocin:'1', ip_chorio:'0', ip_ebl:600, pp_hr:130, pp_sbp:85, pp_tone:'atonic', pp_fib:170, pp_lactate:5.5, pp_ebl_cum:1800, ext_hgbdrop:1.0, ext_retained:'0', ext_subinvolution:'0', ext_delayed:'0', ext_mtdna:1.0 } },
  { id: 's5', title: 'Delayed postpartum hemorrhage',
    vignette: '31-year-old, G2P2, uncomplicated vaginal delivery three weeks ago, presents with new bleeding. Retained products of conception suspected on ultrasound. Hemoglobin dropped 3.5 g/dL from baseline. Cell-free mtDNA elevated at 2.5x baseline.',
    vals: { ap_hgb:12.5, ap_plt:220, ap_fib:350, ap_bmi:26, ap_priorpph:'0', ap_multi:'0', ap_placenta:'none', ip_labor:7, ip_mode:'vag', ip_oxytocin:'0', ip_chorio:'0', ip_ebl:280, pp_hr:80, pp_sbp:120, pp_tone:'firm', pp_fib:310, pp_lactate:1.3, pp_ebl_cum:350, ext_hgbdrop:3.5, ext_retained:'1', ext_subinvolution:'0', ext_delayed:'1', ext_mtdna:2.5 } }
];
