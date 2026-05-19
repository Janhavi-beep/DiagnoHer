import React, { useState, useCallback, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// SYMPTOM DATABASE — 45 symptoms across 8 groups
// ═══════════════════════════════════════════════════════════════════════════════
const SYMPTOM_GROUPS = [
  {
    id: 'menstrual', label: 'Menstrual', icon: '🩸',
    symptoms: [
      { id: 'missed_period',    label: 'Missed / Late Period'         },
      { id: 'irreg_periods',    label: 'Irregular Periods'            },
      { id: 'heavy_bleeding',   label: 'Heavy Menstrual Bleeding'     },
      { id: 'painful_periods',  label: 'Painful Periods / Cramps'     },
      { id: 'spotting',         label: 'Spotting Between Periods'     },
      { id: 'no_periods',       label: 'Periods Stopped Completely'   },
      { id: 'short_cycle',      label: 'Very Short Cycle (<21 days)'  },
      { id: 'long_cycle',       label: 'Long Cycle (>35 days)'        },
      { id: 'clots',            label: 'Blood Clots in Period'        },
    ],
  },
  {
    id: 'pregnancy', label: 'Pregnancy Signs', icon: '🤰',
    symptoms: [
      { id: 'nausea',           label: 'Nausea / Morning Sickness'   },
      { id: 'breast_tender',    label: 'Breast Tenderness / Swelling' },
      { id: 'food_aversion',    label: 'Food Aversions / Cravings'   },
      { id: 'implant_spotting', label: 'Light Implantation Spotting'  },
      { id: 'vomiting',         label: 'Vomiting'                    },
      { id: 'frequent_urin',    label: 'Frequent Urination'          },
      { id: 'bloating',         label: 'Abdominal Bloating'          },
    ],
  },
  {
    id: 'hormonal', label: 'Hormonal', icon: '⚗️',
    symptoms: [
      { id: 'weight_gain',      label: 'Unexplained Weight Gain'     },
      { id: 'weight_loss',      label: 'Unexplained Weight Loss'     },
      { id: 'fatigue',          label: 'Fatigue / Low Energy'        },
      { id: 'hair_loss',        label: 'Hair Thinning / Loss'        },
      { id: 'excess_hair',      label: 'Excess Facial / Body Hair'   },
      { id: 'acne',             label: 'Acne / Skin Breakouts'       },
      { id: 'hot_flashes',      label: 'Hot Flashes / Night Sweats'  },
      { id: 'cold_intol',       label: 'Sensitivity to Cold'         },
      { id: 'low_libido',       label: 'Low Libido'                  },
      { id: 'milk_discharge',   label: 'Milky Nipple Discharge'      },
      { id: 'oily_skin',        label: 'Oily Skin / Scalp'          },
    ],
  },
  {
    id: 'pain', label: 'Pain', icon: '🤕',
    symptoms: [
      { id: 'pelvic_pain',      label: 'Pelvic / Lower Abdominal Pain' },
      { id: 'lower_back',       label: 'Lower Back Pain'              },
      { id: 'painful_sex',      label: 'Pain During Intercourse'      },
      { id: 'headache',         label: 'Frequent Headaches'           },
      { id: 'breast_pain',      label: 'Breast Pain (non-cyclic)'     },
      { id: 'deep_pelvic',      label: 'Deep Pelvic Pain'            },
    ],
  },
  {
    id: 'digestive', label: 'Digestive', icon: '🫁',
    symptoms: [
      { id: 'constipation',     label: 'Constipation'                },
      { id: 'diarrhea',         label: 'Diarrhoea'                   },
      { id: 'nausea_gen',       label: 'Nausea (non-pregnancy)'      },
      { id: 'abdom_pain',       label: 'Abdominal Pain / Cramping'   },
    ],
  },
  {
    id: 'urinary', label: 'Urinary / Discharge', icon: '💧',
    symptoms: [
      { id: 'burn_urin',        label: 'Burning / Painful Urination' },
      { id: 'urin_urgency',     label: 'Urinary Urgency / Leakage'   },
      { id: 'abnorm_discharge', label: 'Abnormal Vaginal Discharge'  },
      { id: 'odour',            label: 'Unpleasant Vaginal Odour'    },
      { id: 'itching',          label: 'Vaginal Itching / Irritation'},
    ],
  },
  {
    id: 'mental', label: 'Mental & Sleep', icon: '🧠',
    symptoms: [
      { id: 'mood_swings',      label: 'Mood Swings / Irritability'  },
      { id: 'anxiety',          label: 'Anxiety / Nervousness'       },
      { id: 'depression',       label: 'Low Mood / Depression'       },
      { id: 'insomnia',         label: 'Insomnia / Poor Sleep'       },
      { id: 'brain_fog',        label: 'Brain Fog / Poor Focus'      },
    ],
  },
  {
    id: 'systemic', label: 'Systemic', icon: '💓',
    symptoms: [
      { id: 'dizziness',        label: 'Dizziness / Lightheadedness' },
      { id: 'shortness',        label: 'Shortness of Breath'         },
      { id: 'pale_skin',        label: 'Pale Skin / Pallor'          },
      { id: 'heart_palp',       label: 'Heart Palpitations'          },
      { id: 'swelling',         label: 'Swelling (hands/feet/face)'  },
      { id: 'dry_skin',         label: 'Dry Skin / Hair'             },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITIONS DATABASE — 30+ conditions with full clinical metadata
// ═══════════════════════════════════════════════════════════════════════════════
const CONDITIONS_DB = [
  // ── PREGNANCY GROUP
  {
    id: 'pregnancy', name: 'Pregnancy', category: 'Pregnancy',
    icon: '🤰', color: '#f9a8d4',
    description: 'A missed period combined with nausea, breast tenderness and fatigue strongly suggests early pregnancy.',
    tests: ['Urine pregnancy test (home)', 'Serum β-hCG blood test', 'Transvaginal ultrasound'],
    doctor: 'OB/GYN', specialty_icon: '👩‍⚕️',
    lifestyle: ['Take folic acid 400mcg daily immediately', 'Avoid alcohol, smoking, raw fish', 'Book your first prenatal appointment'],
    urgency: 'action',
    weights: { missed_period:6, nausea:5, breast_tender:5, vomiting:4, food_aversion:4, implant_spotting:3, fatigue:3, frequent_urin:3, bloating:2, mood_swings:2 },
    boosters: ['missed_period','nausea','breast_tender'], suppressors: ['hot_flashes','cold_intol','excess_hair','no_periods'], maxBase: 22,
    sexuallyActiveMult: 1.5, noSexMult: 0.05, noContraceptionBoost: 1.3, hormonalContraceptionMult: 0.4, iudMult: 0.3,
  },
  {
    id: 'ectopic', name: 'Ectopic Pregnancy', category: 'Pregnancy',
    icon: '⚠️', color: '#ff6b6b',
    description: 'Pregnancy implanted outside the uterus — a medical emergency if rupture occurs. Presents like pregnancy but with one-sided pelvic pain.',
    tests: ['URGENT: Emergency serum β-hCG', 'Transvaginal ultrasound (emergency)', 'Laparoscopy if suspected'],
    doctor: 'Emergency / OB/GYN', specialty_icon: '🚨',
    lifestyle: ['SEEK EMERGENCY CARE if sudden severe one-sided pain', 'Do not delay — ectopic rupture is life-threatening'],
    urgency: 'emergency',
    weights: { missed_period:5, nausea:3, breast_tender:3, pelvic_pain:5, deep_pelvic:5, dizziness:3, fatigue:2, spotting:3, vomiting:2 },
    boosters: ['missed_period','pelvic_pain','deep_pelvic'], suppressors: ['heavy_bleeding','no_periods','hot_flashes'], maxBase: 20,
    sexuallyActiveMult: 1.4, noSexMult: 0.05,
  },
  {
    id: 'early_loss', name: 'Early Pregnancy Loss Risk', category: 'Pregnancy',
    icon: '🫶', color: '#fca5a5',
    description: 'Spotting, cramping, or pain in early pregnancy can indicate miscarriage risk. Medical evaluation is important.',
    tests: ['Serum β-hCG (serial)', 'Progesterone level', 'Pelvic ultrasound'],
    doctor: 'OB/GYN', specialty_icon: '👩‍⚕️',
    lifestyle: ['Rest and limit strenuous activity', 'Contact your OB/GYN promptly', 'Avoid NSAIDs without medical advice'],
    urgency: 'action',
    weights: { missed_period:4, spotting:5, pelvic_pain:4, breast_tender:2, nausea:2, lower_back:3, clots:4, heavy_bleeding:3 },
    boosters: ['spotting','clots','pelvic_pain'], suppressors: ['no_periods','hot_flashes'], maxBase: 18,
    sexuallyActiveMult: 1.3, noSexMult: 0.05,
  },

  // ── MENSTRUAL & HORMONAL DISORDERS
  {
    id: 'pcos', name: 'PCOS', category: 'Menstrual & Hormonal',
    icon: '🧬', color: '#22d3ee',
    description: 'Polycystic Ovary Syndrome — hormonal imbalance causing irregular cycles, elevated androgens, and often insulin resistance.',
    tests: ['LH / FSH hormone panel', 'Testosterone & DHEA-S levels', 'AMH level', 'Fasting insulin & glucose', 'Pelvic ultrasound'],
    doctor: 'Gynaecologist / Endocrinologist', specialty_icon: '🩺',
    lifestyle: ['Low-GI diet reduces insulin resistance', 'Regular aerobic exercise 150min/week', 'Weight loss of 5–10% can restore cycles', 'Consider myo-inositol supplementation'],
    urgency: 'consult',
    weights: { irreg_periods:4, no_periods:3, missed_period:2, excess_hair:5, acne:4, weight_gain:3, hair_loss:3, oily_skin:3, fatigue:2, mood_swings:2, long_cycle:4, low_libido:2 },
    boosters: ['irreg_periods','excess_hair','acne'], suppressors: ['hot_flashes','cold_intol','pale_skin','nausea'], maxBase: 24,
  },
  {
    id: 'amenorrhea', name: 'Amenorrhea', category: 'Menstrual & Hormonal',
    icon: '⏹️', color: '#818cf8',
    description: 'Absence of menstruation for 3+ months (secondary) or never starting (primary). Caused by hormonal, structural, or lifestyle factors.',
    tests: ['Pregnancy test first', 'FSH, LH, Prolactin, TSH', 'Oestrogen levels', 'Pelvic ultrasound', 'MRI if pituitary suspected'],
    doctor: 'Gynaecologist / Endocrinologist', specialty_icon: '🩺',
    lifestyle: ['Maintain healthy BMI (18.5–24.9)', 'Reduce excessive exercise if athlete', 'Manage stress — chronic stress elevates cortisol and suppresses cycles'],
    urgency: 'consult',
    weights: { no_periods:7, missed_period:4, weight_loss:3, weight_gain:2, fatigue:2, hair_loss:2, hot_flashes:3, low_libido:2, brain_fog:1 },
    boosters: ['no_periods'], suppressors: [], maxBase: 18,
  },
  {
    id: 'dysmenorrhea', name: 'Dysmenorrhoea', category: 'Menstrual & Hormonal',
    icon: '😖', color: '#f87171',
    description: 'Painful menstrual cramps — either primary (no structural cause) or secondary (caused by endometriosis, fibroids, etc.).',
    tests: ['Pelvic exam', 'Pelvic ultrasound', 'Laparoscopy (if secondary suspected)'],
    doctor: 'Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['NSAIDs (ibuprofen) taken preventively 1–2 days before period', 'Heat therapy on lower abdomen', 'Omega-3 fatty acids reduce prostaglandins', 'Consider hormonal contraception to suppress cycles'],
    urgency: 'consult',
    weights: { painful_periods:7, heavy_bleeding:3, lower_back:3, deep_pelvic:3, abdom_pain:4, clots:2, nausea_gen:2, diarrhea:2 },
    boosters: ['painful_periods','deep_pelvic'], suppressors: ['hot_flashes'], maxBase: 20,
  },
  {
    id: 'menorrhagia', name: 'Menorrhagia', category: 'Menstrual & Hormonal',
    icon: '🩸', color: '#fb7185',
    description: 'Abnormally heavy or prolonged menstrual bleeding. Can lead to iron-deficiency anaemia.',
    tests: ['Full blood count (haemoglobin)', 'Ferritin / iron studies', 'Thyroid function (TSH)', 'Clotting profile', 'Pelvic ultrasound'],
    doctor: 'Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Track blood loss (soaking >1 pad/hour is heavy)', 'Iron-rich diet: red meat, spinach, lentils', 'Avoid aspirin (promotes bleeding)', 'Tranexamic acid available on prescription'],
    urgency: 'consult',
    weights: { heavy_bleeding:7, clots:5, painful_periods:3, fatigue:3, pale_skin:3, dizziness:2, short_cycle:2, irreg_periods:2 },
    boosters: ['heavy_bleeding','clots'], suppressors: ['no_periods','hot_flashes'], maxBase: 20,
  },
  {
    id: 'pms', name: 'PMS', category: 'Menstrual & Hormonal',
    icon: '🌊', color: '#a78bfa',
    description: 'Premenstrual Syndrome — physical and emotional symptoms occurring 1–2 weeks before a period, resolving with menstruation.',
    tests: ['Symptom diary for 2–3 cycles (diagnostic)', 'Rule out thyroid disorder (TSH)', 'Vitamin D & B6 levels'],
    doctor: 'GP / Gynaecologist', specialty_icon: '👨‍⚕️',
    lifestyle: ['Regular aerobic exercise significantly reduces symptoms', 'Reduce caffeine, alcohol, salt in luteal phase', 'Calcium 1200mg/day shown to reduce PMS', 'Consider Agnus Castus (Vitex) supplement'],
    urgency: 'lifestyle',
    weights: { mood_swings:5, bloating:4, breast_tender:4, headache:3, fatigue:3, irritability:3, constipation:2, depression:2, insomnia:2, anxiety:2 },
    boosters: ['mood_swings','bloating','breast_tender'], suppressors: ['no_periods','hot_flashes','excess_hair'], maxBase: 20,
  },
  {
    id: 'pmdd', name: 'PMDD', category: 'Menstrual & Hormonal',
    icon: '🌪️', color: '#c084fc',
    description: 'Premenstrual Dysphoric Disorder — severe PMS with debilitating mood symptoms including rage, despair, and anxiety before periods.',
    tests: ['Symptom diary (DRSP scale) for 2 cycles', 'Rule out depression & bipolar', 'Hormone levels (in research setting)'],
    doctor: 'Psychiatrist / Gynaecologist', specialty_icon: '🧠',
    lifestyle: ['SSRIs (taken luteal phase or continuously) are first-line treatment', 'CBT shown effective', 'Aerobic exercise daily in luteal phase', 'Reduce alcohol completely in luteal phase'],
    urgency: 'consult',
    weights: { depression:6, mood_swings:6, anxiety:5, insomnia:4, fatigue:3, brain_fog:3, headache:2, bloating:2, breast_tender:2 },
    boosters: ['depression','mood_swings','anxiety'], suppressors: ['no_periods','hot_flashes','excess_hair'], maxBase: 22,
  },
  {
    id: 'perimenopause', name: 'Perimenopause', category: 'Menstrual & Hormonal',
    icon: '🌸', color: '#fb923c',
    description: 'Hormonal transition before menopause (typically 40s–early 50s) causing cycle changes, hot flashes, and mood disruption.',
    tests: ['FSH level (elevated suggests perimenopause)', 'AMH level', 'TSH (to rule out thyroid)', 'Bone density if prolonged amenorrhoea'],
    doctor: 'Gynaecologist / GP', specialty_icon: '👨‍⚕️',
    lifestyle: ['HRT (hormone replacement therapy) highly effective', 'Strength training to protect bone density', 'Reduce caffeine / alcohol to lessen hot flashes', 'Vaginal oestrogen for dryness & painful sex'],
    urgency: 'consult',
    weights: { hot_flashes:6, irreg_periods:5, mood_swings:4, insomnia:4, low_libido:3, fatigue:3, brain_fog:3, weight_gain:2, hair_loss:2, dry_skin:3, painful_sex:3, anxiety:2 },
    boosters: ['hot_flashes','irreg_periods'], suppressors: ['nausea','breast_tender','implant_spotting','food_aversion'], maxBase: 26,
  },

  // ── UTERINE & REPRODUCTIVE
  {
    id: 'endometriosis', name: 'Endometriosis', category: 'Reproductive',
    icon: '◈', color: '#fbbf24',
    description: 'Tissue similar to uterine lining grows outside the uterus, causing severe pain, inflammation, and adhesions.',
    tests: ['Pelvic ultrasound', 'MRI pelvis', 'Laparoscopy (definitive diagnosis)', 'CA-125 (limited specificity)'],
    doctor: 'Gynaecologist (endometriosis specialist)', specialty_icon: '🩺',
    lifestyle: ['Anti-inflammatory diet (omega-3, avoid red meat)', 'Hormonal suppression therapy reduces pain', 'Pelvic physiotherapy for adhesion-related pain', 'Track pain cycle relative to menstruation'],
    urgency: 'consult',
    weights: { painful_periods:6, painful_sex:5, deep_pelvic:5, pelvic_pain:4, heavy_bleeding:4, lower_back:3, bloating:3, fatigue:3, irreg_periods:2, nausea_gen:2, spotting:2, constipation:2, diarrhea:2, infertility:3 },
    boosters: ['painful_periods','painful_sex','deep_pelvic'], suppressors: ['cold_intol','excess_hair','hot_flashes'], maxBase: 28,
  },
  {
    id: 'fibroids', name: 'Uterine Fibroids', category: 'Reproductive',
    icon: '⬡', color: '#a78bfa',
    description: 'Non-cancerous uterine growths — very common, causing heavy bleeding, pressure, and pelvic pain.',
    tests: ['Pelvic ultrasound', 'MRI pelvis (for mapping)', 'Hysteroscopy (submucosal)', 'Full blood count (anaemia check)'],
    doctor: 'Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Iron-rich diet for heavy bleeding anaemia', 'Low-fat plant-based diet may slow growth', 'Vitamin D sufficiency linked to slower growth', 'Discuss medical (GnRH) vs surgical options'],
    urgency: 'consult',
    weights: { heavy_bleeding:6, clots:5, pelvic_pain:4, frequent_urin:4, lower_back:3, bloating:3, painful_periods:3, constipation:2, fatigue:2, spotting:2, irreg_periods:2, urin_urgency:3 },
    boosters: ['heavy_bleeding','clots','pelvic_pain'], suppressors: ['nausea','cold_intol','hot_flashes'], maxBase: 26,
  },
  {
    id: 'adenomyosis', name: 'Adenomyosis', category: 'Reproductive',
    icon: '🔷', color: '#60a5fa',
    description: 'Endometrial tissue grows into the uterine muscle wall, causing a bulky uterus, heavy painful periods, and pelvic pressure.',
    tests: ['Pelvic ultrasound (enlarged boggy uterus)', 'MRI pelvis (more specific)', 'Hysterectomy (definitive but extreme)'],
    doctor: 'Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Hormonal IUD (Mirena) is first-line treatment', 'NSAIDs for pain management', 'GnRH agonists for temporary suppression', 'Heat therapy for cramping'],
    urgency: 'consult',
    weights: { heavy_bleeding:5, painful_periods:6, clots:4, lower_back:4, pelvic_pain:4, bloating:3, fatigue:3, deep_pelvic:4, spotting:2, abdom_pain:3 },
    boosters: ['painful_periods','heavy_bleeding','deep_pelvic'], suppressors: ['hot_flashes','cold_intol','excess_hair'], maxBase: 26,
  },
  {
    id: 'pid', name: 'Pelvic Inflammatory Disease', category: 'Reproductive',
    icon: '🔥', color: '#f97316',
    description: 'Infection of the reproductive organs (uterus, fallopian tubes, ovaries) — often caused by STIs. Urgent treatment needed.',
    tests: ['Cervical / vaginal swab', 'STI screen (chlamydia, gonorrhoea)', 'CRP / WBC blood count', 'Pelvic ultrasound', 'Laparoscopy if severe'],
    doctor: 'GP / Sexual Health Clinic (urgent)', specialty_icon: '🚨',
    lifestyle: ['Complete full antibiotic course — do not stop early', 'Partner testing and treatment essential', 'Abstain from sex during treatment', 'Follow-up in 72 hours to confirm improvement'],
    urgency: 'urgent',
    weights: { pelvic_pain:6, deep_pelvic:5, abnorm_discharge:5, fever:4, lower_back:3, painful_sex:4, odour:3, abdom_pain:4, nausea_gen:2 },
    boosters: ['pelvic_pain','abnorm_discharge','painful_sex'], suppressors: ['cold_intol','hot_flashes','hair_loss'], maxBase: 24,
  },
  {
    id: 'ovarian_cyst', name: 'Ovarian Cyst', category: 'Reproductive',
    icon: '🔬', color: '#34d399',
    description: 'Fluid-filled sac on the ovary — usually benign and self-resolving, but large or ruptured cysts can cause acute pain.',
    tests: ['Pelvic ultrasound', 'CA-125 (if complex cyst)', 'Follow-up ultrasound in 8–12 weeks'],
    doctor: 'Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Monitor with repeat ultrasound as advised', 'Seek emergency care for sudden severe one-sided pain (possible rupture)', 'Hormonal contraception can prevent new functional cysts'],
    urgency: 'monitor',
    weights: { pelvic_pain:5, bloating:4, frequent_urin:3, lower_back:3, painful_sex:3, nausea_gen:3, dizziness:2, spotting:2, irreg_periods:2, missed_period:1 },
    boosters: ['pelvic_pain','bloating'], suppressors: ['cold_intol','hair_loss','excess_hair','hot_flashes'], maxBase: 22,
  },
  {
    id: 'pelvic_floor', name: 'Pelvic Floor Dysfunction', category: 'Reproductive',
    icon: '🎯', color: '#4ade80',
    description: 'Weakness or hypertonicity of pelvic floor muscles causing urinary leakage, pelvic pressure, or pain.',
    tests: ['Pelvic floor physiotherapy assessment', 'Uroflowmetry', 'Cystoscopy (if needed)'],
    doctor: 'Pelvic Floor Physiotherapist / Urogynaecologist', specialty_icon: '🩺',
    lifestyle: ['Pelvic floor exercises (Kegels) 3× daily', 'Avoid heavy lifting and straining', 'Maintain healthy weight', 'Manage constipation'],
    urgency: 'consult',
    weights: { urin_urgency:6, painful_sex:4, pelvic_pain:4, lower_back:3, constipation:3, bloating:2, deep_pelvic:3, abdom_pain:2 },
    boosters: ['urin_urgency','painful_sex'], suppressors: ['hot_flashes','excess_hair','nausea'], maxBase: 18,
  },

  // ── THYROID & ENDOCRINE
  {
    id: 'hypothyroidism', name: 'Hypothyroidism', category: 'Thyroid & Endocrine',
    icon: '🦋', color: '#67e8f9',
    description: 'Underactive thyroid — insufficient T3/T4 production slowing metabolism. Very common in women, often under-diagnosed.',
    tests: ['TSH (elevated in hypo)', 'Free T4 level', 'Anti-TPO antibodies (Hashimoto\'s)', 'Full blood count'],
    doctor: 'GP / Endocrinologist', specialty_icon: '👨‍⚕️',
    lifestyle: ['Levothyroxine is the standard treatment', 'Selenium-rich foods support thyroid', 'Avoid cruciferous veg in large raw quantities', 'Take medication on an empty stomach'],
    urgency: 'consult',
    weights: { fatigue:4, weight_gain:4, cold_intol:6, hair_loss:4, constipation:4, dry_skin:4, brain_fog:3, depression:3, irreg_periods:3, heavy_bleeding:2, swelling:3, heart_palp:2, low_libido:2 },
    boosters: ['cold_intol','fatigue','hair_loss'], suppressors: ['weight_loss','hot_flashes','anxiety','nausea'], maxBase: 30,
  },
  {
    id: 'hyperthyroidism', name: 'Hyperthyroidism', category: 'Thyroid & Endocrine',
    icon: '⚡', color: '#fde68a',
    description: 'Overactive thyroid — excess thyroid hormone accelerates metabolism. Can cause heart problems if untreated.',
    tests: ['TSH (suppressed in hyper)', 'Free T3 & Free T4', 'Thyroid antibodies (TSI, TRAb)', 'Thyroid ultrasound / scan'],
    doctor: 'Endocrinologist', specialty_icon: '🩺',
    lifestyle: ['Anti-thyroid medication or radioiodine therapy', 'Avoid iodine-rich foods during treatment', 'Limit caffeine — worsens palpitations', 'Beta-blockers used for symptom control'],
    urgency: 'consult',
    weights: { weight_loss:6, hot_flashes:5, heart_palp:5, anxiety:4, insomnia:4, fatigue:3, irreg_periods:3, no_periods:2, diarrhea:3, mood_swings:3, hair_loss:2, shortness:2 },
    boosters: ['weight_loss','hot_flashes','heart_palp'], suppressors: ['cold_intol','weight_gain','constipation','dry_skin'], maxBase: 28,
  },
  {
    id: 'hyperprolactinemia', name: 'Hyperprolactinemia', category: 'Thyroid & Endocrine',
    icon: '🧪', color: '#c084fc',
    description: 'Elevated prolactin from the pituitary gland suppresses oestrogen, causing missed periods, milky discharge, and fertility issues.',
    tests: ['Serum prolactin level', 'MRI pituitary gland', 'FSH / LH / Oestrogen levels', 'Visual field test (if large tumour)'],
    doctor: 'Endocrinologist / Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Dopamine agonists (cabergoline) are highly effective', 'Avoid antidopaminergic medications', 'Regular follow-up MRI required', 'Fertility can often be restored with treatment'],
    urgency: 'consult',
    weights: { no_periods:5, missed_period:4, milk_discharge:7, low_libido:4, headache:3, brain_fog:2, fatigue:2, breast_tender:3, irreg_periods:3 },
    boosters: ['milk_discharge','no_periods'], suppressors: ['hot_flashes','excess_hair','cold_intol'], maxBase: 20,
  },
  {
    id: 'insulin_resistance', name: 'Insulin Resistance', category: 'Thyroid & Endocrine',
    icon: '📊', color: '#fdba74',
    description: 'Cells respond poorly to insulin, elevating blood glucose. Closely linked to PCOS, obesity, and type 2 diabetes risk.',
    tests: ['Fasting insulin & glucose', 'HbA1c (glycated haemoglobin)', 'HOMA-IR score', 'Lipid panel', 'OGTT (oral glucose tolerance test)'],
    doctor: 'Endocrinologist / GP', specialty_icon: '👨‍⚕️',
    lifestyle: ['Low-GI diet is the most powerful intervention', 'Aerobic exercise 150min/week + resistance training', 'Intermittent fasting shows benefit in studies', 'Metformin may be prescribed by your doctor'],
    urgency: 'consult',
    weights: { weight_gain:5, fatigue:4, acne:3, excess_hair:3, irreg_periods:3, brain_fog:3, oily_skin:2, dark_patches:3, mood_swings:2 },
    boosters: ['weight_gain','fatigue','irreg_periods'], suppressors: ['weight_loss','cold_intol','hot_flashes'], maxBase: 22,
  },

  // ── PELVIC / URINARY / DISCHARGE
  {
    id: 'uti', name: 'Urinary Tract Infection (UTI)', category: 'Pelvic & Sexual Health',
    icon: '💧', color: '#38bdf8',
    description: 'Bacterial infection of the bladder or urethra — very common in women. Symptoms include burning urination and urgency.',
    tests: ['Urine dipstick test', 'Urine culture & sensitivity', 'Renal ultrasound (if recurrent)'],
    doctor: 'GP (can often self-treat with OTC sachets first)', specialty_icon: '👨‍⚕️',
    lifestyle: ['Drink 2–3L water daily', 'Urinate after intercourse', 'D-mannose supplementation reduces recurrence', 'Avoid bubble baths and synthetic underwear'],
    urgency: 'consult',
    weights: { burn_urin:7, urin_urgency:5, frequent_urin:4, abdom_pain:3, lower_back:2, fatigue:2, nausea_gen:1 },
    boosters: ['burn_urin','urin_urgency'], suppressors: ['excess_hair','hair_loss','cold_intol','hot_flashes'], maxBase: 18,
  },
  {
    id: 'vaginitis', name: 'Vaginitis / Vaginal Infection', category: 'Pelvic & Sexual Health',
    icon: '🦠', color: '#86efac',
    description: 'Inflammation or infection of the vagina — bacterial vaginosis, thrush (candida), or trichomonas are most common.',
    tests: ['Vaginal swab & microscopy', 'pH test', 'STI screen (if applicable)'],
    doctor: 'GP / Sexual Health Clinic', specialty_icon: '👨‍⚕️',
    lifestyle: ['Avoid douching — disrupts natural flora', 'Wear breathable cotton underwear', 'Probiotic (Lactobacillus) supplements help', 'Complete full treatment course'],
    urgency: 'consult',
    weights: { abnorm_discharge:7, itching:6, odour:6, burn_urin:3, painful_sex:3, pelvic_pain:2, abdom_pain:2 },
    boosters: ['abnorm_discharge','itching','odour'], suppressors: ['cold_intol','hot_flashes','hair_loss','excess_hair'], maxBase: 22,
  },
  {
    id: 'dyspareunia', name: 'Dyspareunia', category: 'Pelvic & Sexual Health',
    icon: '❤️‍🩹', color: '#fda4af',
    description: 'Persistent pain during or after intercourse — caused by dryness, endometriosis, vaginismus, infection, or other conditions.',
    tests: ['Pelvic exam', 'STI screen', 'Pelvic ultrasound', 'Referral to vulval clinic if needed'],
    doctor: 'Gynaecologist / Sexual Health Specialist', specialty_icon: '🩺',
    lifestyle: ['Topical oestrogen for dryness-related pain', 'Lubricants (water-based)', 'Pelvic floor physiotherapy for vaginismus', 'Communicate openly with your partner about pain'],
    urgency: 'consult',
    weights: { painful_sex:7, deep_pelvic:4, pelvic_pain:3, itching:2, abnorm_discharge:2, lower_back:2, anxiety:2 },
    boosters: ['painful_sex','deep_pelvic'], suppressors: ['cold_intol','hot_flashes','excess_hair','hair_loss'], maxBase: 18,
  },

  // ── BLOOD & NUTRITIONAL
  {
    id: 'iron_anaemia', name: 'Iron-Deficiency Anaemia', category: 'Nutritional',
    icon: '🩸', color: '#f87171',
    description: 'Low haemoglobin from iron deficiency — very common in women with heavy periods or poor dietary intake.',
    tests: ['Full blood count (FBC / CBC)', 'Serum ferritin (iron stores)', 'TIBC / transferrin saturation', 'Reticulocyte count'],
    doctor: 'GP', specialty_icon: '👨‍⚕️',
    lifestyle: ['Iron-rich foods: red meat, lentils, spinach, tofu', 'Take iron with vitamin C (triples absorption)', 'Avoid tea/coffee within 1 hour of iron-rich meals', 'Iron supplements cause constipation — increase fibre intake'],
    urgency: 'consult',
    weights: { fatigue:5, pale_skin:6, dizziness:5, shortness:4, heavy_bleeding:4, headache:3, heart_palp:3, hair_loss:3, cold_intol:2, brain_fog:2, insomnia:1 },
    boosters: ['pale_skin','fatigue','dizziness'], suppressors: ['excess_hair','acne','nausea','hot_flashes'], maxBase: 28,
  },
  {
    id: 'vit_d', name: 'Vitamin D Deficiency', category: 'Nutritional',
    icon: '☀️', color: '#fef08a',
    description: 'Low vitamin D — extremely common, affects bone health, immunity, mood, and is linked to PCOS, thyroid, and fibroid severity.',
    tests: ['Serum 25-OH Vitamin D level', 'PTH (parathyroid hormone)', 'Calcium level'],
    doctor: 'GP', specialty_icon: '👨‍⚕️',
    lifestyle: ['Supplement 2000–4000 IU D3 daily (most adults benefit)', 'Sun exposure 15–30min/day on skin', 'Fatty fish, egg yolks, fortified foods', 'Take with vitamin K2 and magnesium for absorption'],
    urgency: 'lifestyle',
    weights: { fatigue:4, bone_pain:4, depression:3, mood_swings:3, muscle_weak:3, hair_loss:2, brain_fog:3, insomnia:2, weight_gain:2, frequent_urin:1 },
    boosters: ['fatigue','depression'], suppressors: ['hot_flashes','excess_hair'], maxBase: 20,
  },
  {
    id: 'b12_deficiency', name: 'Vitamin B12 Deficiency', category: 'Nutritional',
    icon: '🧪', color: '#86efac',
    description: 'B12 deficiency causes neurological symptoms, fatigue, and a specific type of anaemia. Common in vegans and those on metformin.',
    tests: ['Serum B12 level', 'MCV (large red cells)', 'Homocysteine level', 'Intrinsic factor antibodies (if pernicious anaemia suspected)'],
    doctor: 'GP', specialty_icon: '👨‍⚕️',
    lifestyle: ['B12 is found in animal products only (meat, fish, dairy, eggs)', 'Vegans must supplement — cyanocobalamin or methylcobalamin', 'Sublingual B12 has better absorption than tablets', 'Severe deficiency requires injections'],
    urgency: 'consult',
    weights: { fatigue:4, dizziness:4, brain_fog:5, depression:3, pale_skin:3, shortness:3, headache:2, insomnia:2, mood_swings:2, heart_palp:2 },
    boosters: ['brain_fog','fatigue','dizziness'], suppressors: ['hot_flashes','excess_hair','acne'], maxBase: 22,
  },

  // ── MENTAL & LIFESTYLE
  {
    id: 'anxiety_disorder', name: 'Anxiety Disorder', category: 'Mental Health',
    icon: '😰', color: '#c4b5fd',
    description: 'Persistent anxiety impacting daily life — includes GAD, panic disorder, or hormonally-triggered anxiety.',
    tests: ['GAD-7 screening questionnaire', 'Rule out thyroid disorder (TSH)', 'Rule out B12/vitamin D deficiency', 'Cortisol levels if adrenal cause suspected'],
    doctor: 'GP / Psychologist / Psychiatrist', specialty_icon: '🧠',
    lifestyle: ['CBT (cognitive behavioural therapy) is gold-standard', 'Aerobic exercise 150min/week reduces anxiety significantly', 'Mindfulness and breathing techniques', 'Reduce caffeine and alcohol'],
    urgency: 'consult',
    weights: { anxiety:7, heart_palp:4, insomnia:4, mood_swings:3, brain_fog:3, headache:3, fatigue:3, shortness:3, dizziness:2, depression:2 },
    boosters: ['anxiety','heart_palp','insomnia'], suppressors: ['cold_intol','excess_hair','pale_skin'], maxBase: 26,
  },
  {
    id: 'depression', name: 'Depression', category: 'Mental Health',
    icon: '🌧️', color: '#94a3b8',
    description: 'Persistent low mood, anhedonia, and fatigue affecting daily function. Strongly linked to hormonal fluctuations in women.',
    tests: ['PHQ-9 screening questionnaire', 'TSH (thyroid)', 'Vitamin D & B12 levels', 'Hormonal panel if cycle-related'],
    doctor: 'GP / Psychologist / Psychiatrist', specialty_icon: '🧠',
    lifestyle: ['Aerobic exercise shown to be as effective as antidepressants for mild-moderate', 'Ensure adequate sleep (7–9 hours)', 'Social connection is protective', 'Consider therapy before or alongside medication'],
    urgency: 'consult',
    weights: { depression:7, fatigue:4, insomnia:4, brain_fog:4, mood_swings:3, low_libido:3, weight_gain:2, weight_loss:2, anxiety:2, headache:2 },
    boosters: ['depression','fatigue','insomnia'], suppressors: ['excess_hair','acne','hot_flashes'], maxBase: 26,
  },
  {
    id: 'chronic_fatigue', name: 'Chronic Fatigue Syndrome', category: 'Mental Health',
    icon: '🪫', color: '#9ca3af',
    description: 'Severe, persistent fatigue not relieved by rest, often with cognitive symptoms. Diagnosis of exclusion.',
    tests: ['Full blood count', 'TSH', 'Vitamin D, B12, ferritin', 'Cortisol', 'Epstein-Barr / viral serology', 'Sleep study'],
    doctor: 'GP / Specialist ME/CFS Clinic', specialty_icon: '👨‍⚕️',
    lifestyle: ['Pacing activity to avoid post-exertional malaise is essential', 'Consistent sleep/wake schedule', 'Graded exercise therapy remains controversial — listen to your body', 'Low-inflammatory diet may help'],
    urgency: 'consult',
    weights: { fatigue:7, brain_fog:5, insomnia:4, headache:3, depression:3, mood_swings:3, dizziness:2, muscle_weak:3, anxiety:2 },
    boosters: ['fatigue','brain_fog'], suppressors: ['excess_hair','acne','hot_flashes'], maxBase: 24,
  },
  {
    id: 'sleep_disorder', name: 'Sleep Disorder', category: 'Mental Health',
    icon: '🌙', color: '#6366f1',
    description: 'Insomnia, sleep apnoea, or other sleep disruption causing daytime fatigue and cognitive impairment.',
    tests: ['Epworth Sleepiness Scale', 'Sleep study (polysomnography) if apnoea suspected', 'TSH, cortisol', 'Sleep diary for 2 weeks'],
    doctor: 'GP / Sleep Specialist', specialty_icon: '👨‍⚕️',
    lifestyle: ['Strict sleep hygiene: consistent bedtime, no screens 1hr before', 'Keep bedroom cool and dark', 'CBT-I (for insomnia) is more effective than sleeping pills long-term', 'Limit caffeine after 2pm'],
    urgency: 'lifestyle',
    weights: { insomnia:7, fatigue:5, brain_fog:4, mood_swings:3, anxiety:3, depression:3, headache:2 },
    boosters: ['insomnia','fatigue'], suppressors: ['excess_hair','hot_flashes'], maxBase: 22,
  },

  // ── METABOLIC & SKIN
  {
    id: 'hormonal_acne', name: 'Hormonal Acne', category: 'Skin & Metabolic',
    icon: '😣', color: '#fb923c',
    description: 'Acne driven by androgen excess or hormonal fluctuations — typically around the jaw, chin, and lower face.',
    tests: ['Testosterone & DHEA-S levels', 'LH/FSH ratio', 'Insulin & glucose (insulin resistance)', 'Rule out PCOS'],
    doctor: 'Dermatologist / Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Low-GI diet reduces androgen-driven acne', 'Combined oral contraceptive pill suppresses androgens', 'Spironolactone is highly effective (off-label)', 'Avoid dairy and high-sugar foods'],
    urgency: 'lifestyle',
    weights: { acne:7, oily_skin:5, excess_hair:4, irreg_periods:3, weight_gain:3, hair_loss:2 },
    boosters: ['acne','oily_skin','excess_hair'], suppressors: ['cold_intol','pale_skin','hot_flashes'], maxBase: 18,
  },
  {
    id: 'hirsutism', name: 'Hirsutism', category: 'Skin & Metabolic',
    icon: '🧔', color: '#d97706',
    description: 'Excess androgen-driven hair growth on the face, chest, or abdomen — typically associated with PCOS or adrenal conditions.',
    tests: ['Total & free testosterone', 'DHEA-S (adrenal androgens)', 'LH/FSH', '17-OH Progesterone (rule out CAH)', 'Rule out Cushing\'s syndrome'],
    doctor: 'Endocrinologist / Gynaecologist', specialty_icon: '🩺',
    lifestyle: ['Anti-androgens (spironolactone, flutamide) are effective', 'OCP reduces androgen levels', 'Weight loss reduces androgens in PCOS', 'Electrolysis or laser for cosmetic removal'],
    urgency: 'consult',
    weights: { excess_hair:8, acne:4, oily_skin:3, irreg_periods:3, weight_gain:3, hair_loss:2, no_periods:2 },
    boosters: ['excess_hair','acne'], suppressors: ['cold_intol','pale_skin','depression','hot_flashes'], maxBase: 20,
  },
  {
    id: 'metabolic_syndrome', name: 'Metabolic Syndrome', category: 'Skin & Metabolic',
    icon: '📊', color: '#f59e0b',
    description: 'Cluster of conditions (high waist circumference, blood pressure, glucose, triglycerides) significantly elevating cardiovascular risk.',
    tests: ['Fasting glucose & insulin', 'Lipid panel (triglycerides, HDL)', 'Blood pressure measurement', 'Waist circumference', 'HbA1c'],
    doctor: 'GP / Endocrinologist', specialty_icon: '👨‍⚕️',
    lifestyle: ['Mediterranean diet is most evidence-based', 'Aerobic + resistance training is essential', '5–10% weight loss significantly improves all markers', 'Reduce processed foods, refined carbs, and sugary drinks'],
    urgency: 'consult',
    weights: { weight_gain:6, fatigue:4, brain_fog:3, headache:2, dizziness:2, acne:2, excess_hair:2, irreg_periods:2 },
    boosters: ['weight_gain','fatigue'], suppressors: ['weight_loss','cold_intol','hot_flashes'], maxBase: 18,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function scoreAll(selectedSet, answers) {
  const sel = Array.from(selectedSet);
  const age = parseInt(answers.age) || 0;
  const results = [];

  for (const cond of CONDITIONS_DB) {
    if (!cond.weights) continue;
    let raw = 0;
    const matched = [];

    for (const sym of sel) {
      if (cond.weights[sym]) { raw += cond.weights[sym]; matched.push(sym); }
    }

    // Boosters
    const bCount = (cond.boosters || []).filter(b => sel.includes(b)).length;
    if (bCount >= 2) raw = Math.round(raw * 1.3);
    if (bCount >= 3) raw = Math.round(raw * 1.2);

    // Suppressors
    const sCount = (cond.suppressors || []).filter(s => sel.includes(s)).length;
    raw = Math.max(0, raw - sCount * 3);

    // Age modifiers
    if (cond.id === 'pregnancy' || cond.id === 'ectopic' || cond.id === 'early_loss') {
      if (age > 0 && (age < 13 || age > 52)) { raw = 0; }
      else {
        if (answers.sexually_active === 'yes')       raw = Math.round(raw * (cond.sexuallyActiveMult || 1.4));
        else if (answers.sexually_active === 'no')   raw = Math.round(raw * (cond.noSexMult || 0.04));
        if (answers.contraception === 'none' && answers.sexually_active === 'yes') raw = Math.round(raw * (cond.noContraceptionBoost || 1.3));
        if (answers.contraception === 'hormonal')    raw = Math.round(raw * (cond.hormonalContraceptionMult || 0.4));
        if (answers.contraception === 'iud')         raw = Math.round(raw * (cond.iudMult || 0.3));
        if (answers.contraception === 'implant')     raw = Math.round(raw * 0.25);
      }
    }
    if (cond.id === 'perimenopause') {
      if (age >= 45)             raw = Math.round(raw * 1.5);
      else if (age > 0 && age < 35) raw = Math.round(raw * 0.2);
      else if (age >= 35 && age < 45) raw = Math.round(raw * 0.7);
    }
    if (cond.id === 'amenorrhea' && answers.athlete === 'yes') raw = Math.round(raw * 1.3);

    const pct = Math.min(Math.round((raw / ((cond.maxBase || 20) + 4)) * 100), 97);
    if (pct > 0) results.push({ ...cond, pct, matched });
  }

  results.sort((a, b) => b.pct - a.pct);
  return results;
}

const URGENCY_META = {
  emergency: { label: '🚨 Emergency', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.35)' },
  urgent:    { label: '⚠️ Urgent',    bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.3)' },
  action:    { label: '📋 Take Action', bg: 'rgba(249,168,212,0.1)', color: '#f9a8d4', border: 'rgba(249,168,212,0.3)' },
  consult:   { label: '🩺 See Doctor', bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  monitor:   { label: '👁️ Monitor',   bg: 'rgba(52,211,153,0.08)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  lifestyle: { label: '🌱 Lifestyle',  bg: 'rgba(134,239,172,0.08)', color: '#86efac', border: 'rgba(134,239,172,0.2)' },
};

const ALL_SYMPTOMS = SYMPTOM_GROUPS.flatMap(g => g.symptoms.map(s => ({ ...s, group: g.label })));

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SymptomCheckerPage() {
  const [step, setStep]       = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [activeGroup, setActiveGroup] = useState('All');
  const [answers, setAnswers] = useState({ age: '', sexually_active: '', contraception: '', athlete: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const resultRef = useRef(null);

  const toggle = useCallback((id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const analyze = () => {
    setLoading(true);
    setTimeout(() => {
      const res = scoreAll(selected, answers);
      setResults(res);
      setLoading(false);
      setStep(3);
    }, 1400);
  };

  const reset = () => {
    setStep(1); setSelected(new Set()); setResults([]); setExpandedCard(null);
    setAnswers({ age: '', sexually_active: '', contraception: '', athlete: '' });
    setActiveGroup('All');
  };

  useEffect(() => {
    if (step === 3 && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const visibleSymptoms = activeGroup === 'All' ? ALL_SYMPTOMS
    : SYMPTOM_GROUPS.find(g => g.label === activeGroup)?.symptoms.map(s => ({ ...s, group: activeGroup })) || [];

  // ── Step indicator
  const Steps = () => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'2.5rem' }}>
      {['Select Symptoms', 'Your Details', 'Results'].map((label, i) => {
        const s = i + 1; const done = step > s; const active = step === s;
        return (
          <React.Fragment key={s}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, fontFamily:'var(--font-mono)', flexShrink:0, border:`2px solid ${done || active ? 'var(--cyan)' : 'var(--border)'}`, background: done ? 'var(--cyan)' : 'transparent', color: done ? 'var(--bg)' : active ? 'var(--cyan)' : 'var(--text-3)' }}>
                {done ? '✓' : s}
              </div>
              <span style={{ fontSize:'0.78rem', fontFamily:'var(--font-mono)', color: active ? 'var(--cyan)' : 'var(--text-3)', fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width:36, height:2, background: step > s ? 'var(--cyan)' : 'var(--border)', borderRadius:1, flexShrink:0 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1 — SELECT SYMPTOMS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 1) return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-breadcrumb">NeuralCore · Health Tools</div>
          <h1 className="page-title">🔍 Comprehensive Symptom Checker</h1>
          <p className="page-subtitle">Select all symptoms you are experiencing. Analyses <strong style={{color:'var(--cyan)'}}>30+ conditions</strong> using evidence-based clinical symptom mapping — fully independent of the imaging AI models.</p>
        </div>
        <div className="page-badges">
          <span className="badge badge-cyan">45 Symptoms</span>
          <span className="badge badge-teal">30+ Conditions</span>
          <span className="badge" style={{ color:'#f9a8d4', borderColor:'rgba(249,168,212,0.25)', background:'rgba(249,168,212,0.06)' }}>Pregnancy Detection</span>
        </div>
      </div>

      <Steps />

      {/* Group tabs */}
      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {['All', ...SYMPTOM_GROUPS.map(g => g.label)].map(g => {
          const grp = SYMPTOM_GROUPS.find(x => x.label === g);
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.38rem 0.9rem', borderRadius:999, border:'1.5px solid', cursor:'pointer', transition:'all 0.15s', fontSize:'0.78rem', fontFamily:'var(--font-mono)',
                borderColor: activeGroup===g ? 'var(--cyan)' : 'var(--border)',
                background:  activeGroup===g ? 'rgba(34,211,238,0.1)' : 'transparent',
                color:       activeGroup===g ? 'var(--cyan)' : 'var(--text-3)' }}>
              {grp?.icon} {g}
            </button>
          );
        })}
        <span style={{ marginLeft:'auto', alignSelf:'center', fontFamily:'var(--font-mono)', fontSize:'0.74rem', color: selected.size > 0 ? 'var(--cyan)' : 'var(--text-3)', fontWeight: selected.size > 0 ? 600 : 400 }}>
          {selected.size} symptom{selected.size !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Symptom chips */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(195px, 1fr))', gap:'0.5rem', marginBottom:'1.75rem' }}>
        {visibleSymptoms.map(s => {
          const on = selected.has(s.id);
          return (
            <div key={s.id} onClick={() => toggle(s.id)}
              style={{ display:'flex', alignItems:'center', gap:'0.55rem', padding:'0.58rem 0.9rem', borderRadius:10, border:`1.5px solid ${on ? 'var(--cyan)' : 'var(--border)'}`, background: on ? 'rgba(34,211,238,0.08)' : 'var(--surface)', color: on ? 'var(--cyan)' : 'var(--text-2)', fontWeight: on ? 600 : 400, cursor:'pointer', userSelect:'none', transition:'all 0.12s', fontSize:'0.8rem' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, border:`2px solid ${on ? 'var(--cyan)' : 'var(--border)'}`, background: on ? 'var(--cyan)' : 'transparent', transition:'all 0.12s' }} />
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Selected pills */}
      {selected.size > 0 && (
        <div style={{ padding:'0.75rem 1rem', borderRadius:10, background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.12)', display:'flex', flexWrap:'wrap', gap:'0.3rem', alignItems:'center', marginBottom:'1.5rem' }}>
          <span style={{ fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--font-mono)', marginRight:'0.3rem', flexShrink:0 }}>Selected:</span>
          {Array.from(selected).map(id => {
            const s = ALL_SYMPTOMS.find(x => x.id === id);
            return s ? <span key={id} onClick={() => toggle(id)} style={{ fontSize:'0.68rem', padding:'0.18rem 0.5rem', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:5, color:'var(--cyan)', fontFamily:'var(--font-mono)', cursor:'pointer' }}>✕ {s.label}</span> : null;
          })}
        </div>
      )}

      <div style={{ textAlign:'center' }}>
        <button className="btn btn-primary" disabled={selected.size === 0} onClick={() => setStep(2)} style={{ padding:'0.75rem 2.5rem', fontSize:'0.92rem' }}>
          Continue to Details →
        </button>
        {selected.size === 0 && <p style={{ marginTop:'0.6rem', fontSize:'0.75rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>Select at least one symptom to proceed</p>}
      </div>
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2 — DETAILS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 2) return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-breadcrumb">NeuralCore · Symptom Checker</div>
          <h1 className="page-title">📋 A Few Details</h1>
          <p className="page-subtitle">These answers improve accuracy — especially for distinguishing pregnancy, thyroid, and hormonal conditions.</p>
        </div>
      </div>
      <Steps />

      <div style={{ maxWidth:560, margin:'0 auto' }}>
        <div className="card" style={{ marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Your Age</label>
              <input type="number" placeholder="e.g. 26" min="12" max="70" value={answers.age} onChange={e => setAnswers(p => ({...p,age:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Are you an athlete / very active?</label>
              <select value={answers.athlete} onChange={e => setAnswers(p => ({...p,athlete:e.target.value}))}>
                <option value="">Select...</option>
                <option value="no">No / Lightly active</option>
                <option value="yes">Yes — high training load</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Are you currently sexually active? <span className="form-label-hint">(affects pregnancy assessment)</span></label>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.3rem', flexWrap:'wrap' }}>
              {[['yes','Yes'],['no','No'],['prefer_not','Prefer not to say']].map(([v,l]) => (
                <button key={v} onClick={() => setAnswers(p => ({...p,sexually_active:v}))}
                  style={{ flex:1, minWidth:100, padding:'0.6rem 0.4rem', borderRadius:9, border:`1.5px solid ${answers.sexually_active===v?'var(--cyan)':'var(--border)'}`, background: answers.sexually_active===v?'rgba(34,211,238,0.1)':'var(--surface)', color: answers.sexually_active===v?'var(--cyan)':'var(--text-2)', fontSize:'0.8rem', fontFamily:'var(--font-mono)', cursor:'pointer', transition:'all 0.15s' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {answers.sexually_active === 'yes' && (
            <div className="form-group">
              <label className="form-label">Current contraception method</label>
              <select value={answers.contraception} onChange={e => setAnswers(p => ({...p,contraception:e.target.value}))}>
                <option value="">Select...</option>
                <option value="none">None</option>
                <option value="condom">Condoms only</option>
                <option value="hormonal">Hormonal pill / patch / ring</option>
                <option value="iud">IUD / Coil</option>
                <option value="implant">Implant or injection</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ padding:'0.65rem 1rem', borderRadius:8, background:'rgba(34,211,238,0.03)', border:'1px solid var(--border)', marginBottom:'1.5rem', fontSize:'0.71rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>
          🔒 All processing is local — no data is sent to any server.
        </div>

        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
          <button className="btn btn-primary" onClick={analyze} disabled={loading} style={{ flex:1 }}>
            {loading ? <><span className="spinner-sm" /> Analysing {selected.size} symptoms across 30+ conditions...</> : '🔍 Analyse My Symptoms →'}
          </button>
        </div>
      </div>
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3 — RESULTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 3) {
    const mostLikely  = results.filter(r => r.pct >= 50);
    const possible    = results.filter(r => r.pct >= 25 && r.pct < 50);
    const lowFlag     = results.filter(r => r.pct >= 10 && r.pct < 25);

    // Collect unique tests and doctors from flagged conditions
    const flaggedConds = [...mostLikely, ...possible];
    const allTests = [...new Set(flaggedConds.flatMap(c => c.tests || []))].slice(0, 8);
    const allDoctors = [...new Map(flaggedConds.map(c => [c.doctor, c])).values()].slice(0, 4);

    const ConditionCard = ({ cond, rank }) => {
      const expanded = expandedCard === cond.id;
      const um = URGENCY_META[cond.urgency] || URGENCY_META.consult;
      const matchedNames = (cond.matched || []).map(id => ALL_SYMPTOMS.find(s => s.id === id)?.label).filter(Boolean);

      return (
        <div style={{ borderRadius:14, border:`1.5px solid ${expanded ? cond.color : `${cond.color}40`}`, background: expanded ? `color-mix(in srgb, ${cond.color} 6%, var(--bg-2))` : 'var(--surface)', transition:'all 0.2s', overflow:'hidden' }}>
          {/* Card header */}
          <div style={{ padding:'1.1rem 1.25rem', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:'0.9rem' }} onClick={() => setExpandedCard(expanded ? null : cond.id)}>
            <span style={{ fontSize:'1.5rem', flexShrink:0, marginTop:2 }}>{cond.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.3rem' }}>
                <span style={{ fontWeight:700, fontSize:'0.92rem', color: cond.color }}>{cond.name}</span>
                <span style={{ fontSize:'0.62rem', padding:'0.18rem 0.55rem', borderRadius:999, background:`${cond.color}20`, color:cond.color, border:`1px solid ${cond.color}50`, fontFamily:'var(--font-mono)', fontWeight:700 }}>{cond.category}</span>
                <span style={{ marginLeft:'auto', fontSize:'0.63rem', padding:'0.18rem 0.55rem', borderRadius:999, background:um.bg, color:um.color, border:`1px solid ${um.border||um.color+'50'}`, fontFamily:'var(--font-mono)', fontWeight:600 }}>{um.label}</span>
              </div>

              {/* Confidence bar */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <div style={{ flex:1, height:5, background:'var(--surface-3)', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${cond.pct}%`, background: cond.color, borderRadius:999, transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', fontWeight:700, color:cond.color, flexShrink:0 }}>{cond.pct}%</span>
              </div>

              {/* Description — always visible */}
              <p style={{ fontSize:'0.8rem', color:'var(--text-2)', lineHeight:1.6, margin:'0.55rem 0 0.4rem', borderLeft:`2px solid ${cond.color}60`, paddingLeft:'0.6rem' }}>
                {cond.description}
              </p>

              {matchedNames.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem', marginTop:'0.45rem' }}>
                  {matchedNames.slice(0, 4).map(n => <span key={n} style={{ fontSize:'0.63rem', padding:'0.14rem 0.4rem', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-3)' }}>{n}</span>)}
                  {matchedNames.length > 4 && <span style={{ fontSize:'0.63rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>+{matchedNames.length-4} more</span>}
                </div>
              )}
            </div>
            <span style={{ color:'var(--text-3)', fontSize:'0.75rem', flexShrink:0, marginTop:4, transition:'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </div>

          {/* Expanded detail — tests, doctor, lifestyle */}
          {expanded && (
            <div style={{ padding:'0 1.25rem 1.25rem', borderTop:`1px solid ${cond.color}25` }}>
              {/* no repeated description here */}
              <div style={{ height:'0.25rem' }} />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                {/* Tests */}
                <div style={{ padding:'0.85rem', borderRadius:10, background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.12)' }}>
                  <div style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', color:'var(--cyan)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'0.6rem' }}>🧪 Suggested Tests</div>
                  {(cond.tests || []).map((t, i) => <div key={i} style={{ fontSize:'0.78rem', color:'var(--text-2)', marginBottom:'0.3rem', display:'flex', gap:'0.4rem' }}><span style={{ color:'var(--cyan)', flexShrink:0 }}>→</span>{t}</div>)}
                </div>

                {/* Doctor */}
                <div style={{ padding:'0.85rem', borderRadius:10, background:`${cond.color}0a`, border:`1px solid ${cond.color}20` }}>
                  <div style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', color:cond.color, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'0.6rem' }}>👩‍⚕️ Recommended Doctor</div>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:cond.color, marginBottom:'0.5rem' }}>{cond.specialty_icon} {cond.doctor}</div>

                  {/* Lifestyle */}
                  {(cond.lifestyle || []).length > 0 && (
                    <>
                      <div style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', color:'var(--emerald)', textTransform:'uppercase', letterSpacing:'1.5px', margin:'0.7rem 0 0.5rem' }}>🌱 Lifestyle Actions</div>
                      {(cond.lifestyle || []).map((l, i) => <div key={i} style={{ fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'0.3rem', display:'flex', gap:'0.4rem', lineHeight:1.4 }}><span style={{ color:'var(--emerald)', flexShrink:0 }}>✓</span>{l}</div>)}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="page-container" ref={resultRef}>
        <div className="page-header">
          <div className="page-title-group">
            <div className="page-breadcrumb">NeuralCore · Symptom Checker</div>
            <h1 className="page-title">📊 Assessment Results</h1>
            <p className="page-subtitle">Based on <strong style={{color:'var(--cyan)'}}>{selected.size}</strong> symptoms — {results.filter(r=>r.pct>=25).length} conditions flagged</p>
          </div>
          <button className="btn btn-outline" onClick={reset}>↺ Start Over</button>
        </div>

        {/* ── MOST LIKELY CONDITIONS */}
        {mostLikely.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ padding:'0.4rem 1rem', borderRadius:999, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', fontSize:'0.78rem', fontFamily:'var(--font-mono)', color:'#f87171', fontWeight:700 }}>
                🎯 MOST LIKELY — {mostLikely.length} condition{mostLikely.length>1?'s':''}
              </div>
              <span style={{ fontSize:'0.75rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>≥50% probability · click to expand</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
              {mostLikely.map((c, i) => <ConditionCard key={c.id} cond={c} rank={i+1} />)}
            </div>
          </div>
        )}

        {/* ── POSSIBLE CONDITIONS */}
        {possible.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ padding:'0.4rem 1rem', borderRadius:999, background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)', fontSize:'0.78rem', fontFamily:'var(--font-mono)', color:'#fbbf24', fontWeight:700 }}>
                🔍 POSSIBLE — {possible.length} condition{possible.length>1?'s':''}
              </div>
              <span style={{ fontSize:'0.75rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>25–49% probability · worth investigating</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
              {possible.map((c, i) => <ConditionCard key={c.id} cond={c} rank={i+1} />)}
            </div>
          </div>
        )}

        {/* ── LOW SIGNAL */}
        {lowFlag.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ padding:'0.4rem 1rem', borderRadius:999, background:'rgba(148,163,184,0.08)', border:'1px solid var(--border)', fontSize:'0.75rem', fontFamily:'var(--font-mono)', color:'var(--text-3)', fontWeight:600, display:'inline-block', marginBottom:'1rem' }}>
              💡 LOW SIGNAL — {lowFlag.length} condition{lowFlag.length>1?'s':''} with weak association (10–24%)
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'0.5rem' }}>
              {lowFlag.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.75rem 1rem', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)' }}>
                  <span style={{ fontSize:'1.1rem' }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-2)' }}>{c.name}</div>
                    <div style={{ height:3, background:'var(--surface-3)', borderRadius:999, marginTop:'0.35rem', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${c.pct}%`, background:'var(--border)', borderRadius:999 }} />
                    </div>
                  </div>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'var(--text-3)' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUMMARY PANEL — Tests + Doctors */}
        {flaggedConds.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
            {/* Suggested Tests */}
            <div className="card">
              <div className="card-title">🧪 Recommended Tests</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {allTests.map((t, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start', fontSize:'0.83rem', color:'var(--text-1)', lineHeight:1.5 }}>
                    <span style={{ color:'var(--cyan)', fontWeight:700, flexShrink:0, fontFamily:'var(--font-mono)' }}>→</span>{t}
                  </div>
                ))}
              </div>
            </div>

            {/* Doctors */}
            <div className="card">
              <div className="card-title">👩‍⚕️ Specialists to Consult</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {allDoctors.map((c) => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.6rem 0.85rem', borderRadius:9, border:`1px solid ${c.color}30`, background:`${c.color}06` }}>
                    <span style={{ fontSize:'1.2rem' }}>{c.specialty_icon}</span>
                    <div>
                      <div style={{ fontSize:'0.83rem', fontWeight:700, color:c.color }}>{c.doctor}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-3)', fontFamily:'var(--font-mono)' }}>for: {c.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NO RESULTS */}
        {results.filter(r => r.pct >= 10).length === 0 && (
          <div className="card" style={{ textAlign:'center', padding:'2.5rem', marginBottom:'2rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>✅</div>
            <div style={{ fontWeight:700, marginBottom:'0.5rem' }}>No Strong Indicators Found</div>
            <p style={{ fontSize:'0.85rem', color:'var(--text-2)', lineHeight:1.65 }}>Your symptom profile does not strongly match any of the tracked conditions. If symptoms persist, a routine check-up is always worthwhile.</p>
          </div>
        )}

        <div className="disclaimer">
          ⚠ This tool is for educational awareness only and does not constitute a medical diagnosis. Symptom patterns are indicative — not definitive. Always consult a qualified healthcare professional for proper evaluation and treatment.
        </div>
      </div>
    );
  }

  return null;
}
