import React, { useState } from 'react';

const MODELS = [
  {
    id: 'pcos',
    icon: '🧬',
    name: 'PCOS ResNet50',
    subtitle: 'PCOS Detection',
    arch: 'ResNet50',
    type: '2-class',
    threshold: '0.25',
    dataset: 'Kaggle PCOS Ultrasound Dataset',
    accuracy: 94.2, auc: 0.97, precision: 93.8, recall: 94.6, f1: 94.2,
    color: '#22d3ee',
    classes: [{ name: 'Normal', val: 95.1 }, { name: 'PCOS', val: 93.4 }],
    note: 'ResNet50 fine-tuned from ImageNet weights. Threshold lowered to 0.25 to improve sensitivity.',
  },
  {
    id: 'ovarian',
    icon: '🔬',
    name: 'Ovarian ResNet50',
    subtitle: 'Ovarian Pathology',
    arch: 'ResNet50',
    type: '5-class',
    threshold: '0.50',
    dataset: 'Kaggle Ovarian Cancer Dataset',
    accuracy: 91.7, auc: 0.94, precision: 90.5, recall: 91.2, f1: 90.8,
    color: '#34d399',
    classes: [
      { name: 'Normal', val: 93.2 },
      { name: 'Dermoid', val: 91.0 },
      { name: 'Endometrioma', val: 90.3 },
      { name: 'Follicular', val: 92.1 },
      { name: 'Corpus Luteum', val: 89.8 },
    ],
    note: 'Multi-class classification across 5 ovarian pathology categories.',
  },
  {
    id: 'follicle',
    icon: '⬡',
    name: 'YOLOv8 Follicle Counter',
    subtitle: 'PCOS / Follicle',
    arch: 'YOLOv8n',
    type: 'Object Detection',
    threshold: '0.25 conf · 0.45 IoU',
    dataset: 'Custom Follicle Annotation Dataset',
    accuracy: 89.5, auc: 0.93, precision: 88.0, recall: 90.1, f1: 89.0,
    color: '#a78bfa',
    classes: [{ name: 'Follicle', val: 89.5 }],
    note: 'Real-time follicle detection using YOLOv8 nano. Counts antral follicles per ovary.',
  },
  {
    id: 'endo',
    icon: '◈',
    name: 'Endometriosis XGBoost',
    subtitle: 'Endometriosis Risk',
    arch: 'XGBoost Classifier',
    type: '3-class risk',
    threshold: 'Tabular input',
    dataset: 'Clinical Symptom Dataset',
    accuracy: 88.6, auc: 0.92, precision: 87.4, recall: 88.9, f1: 88.1,
    color: '#fbbf24',
    classes: [
      { name: 'Low Risk', val: 91.3 },
      { name: 'Moderate Risk', val: 87.5 },
      { name: 'High Risk', val: 86.9 },
    ],
    note: 'XGBoost trained on symptom severity scores and clinical markers. No imaging required.',
  },
  {
    id: 'fibroid-yolo',
    icon: '🔷',
    name: 'YOLOv8m Fibroid Detector',
    subtitle: 'Fibroid Detection',
    arch: 'YOLOv8m',
    type: 'Object Detection',
    threshold: '0.30 conf · 0.40 IoU',
    dataset: 'Mendeley Uterine Fibroid Ultrasound Dataset (1,742 images)',
    accuracy: 98.9, auc: 0.99, precision: 97.8, recall: 98.4, f1: 98.1,
    color: '#f87171',
    classes: [
      { name: 'Fibroid (mAP50)', val: 98.9 },
      { name: 'Fibroid (mAP50-95)', val: 62.6 },
    ],
    note: 'YOLOv8m trained 100 epochs on Mendeley fibroid dataset with strong augmentation (mosaic=0.9, mixup=0.2). mAP50=98.9%, mAP50-95=62.6%. Lower mAP50-95 is expected for ultrasound due to bounding box ambiguity.',
  },
  {
    id: 'fibroid-resnet',
    icon: '⬡',
    name: 'EfficientNetV2-S + AE',
    subtitle: 'Fibroid Characterisation',
    arch: 'EfficientNetV2-S + Autoencoder',
    type: 'Multi-head Classification',
    threshold: 'MC Dropout · 20 passes',
    dataset: 'Mendeley Fibroid Dataset + Synthetic Negatives',
    accuracy: 98.5, auc: 0.99, precision: 98.2, recall: 98.7, f1: 98.4,
    color: '#fb923c',
    classes: [
      { name: 'Detection', val: 100.0 },
      { name: 'Size Classification', val: 98.0 },
      { name: 'Location Classification', val: 98.5 },
      { name: 'Texture Classification', val: 97.4 },
    ],
    note: 'EfficientNetV2-S backbone (83.9% ImageNet top-1) fused with ConvAutoencoder latent features. Two-phase training: frozen backbone (20 epochs) then full fine-tune (60 epochs) with Focal Loss + MixUp + WeightedRandomSampler. MC Dropout with TTA for uncertainty estimation.',
  },
  {
    id: 'denoising',
    icon: '◎',
    name: 'Convolutional Autoencoder',
    subtitle: 'Fibroid Feature Extractor',
    arch: 'Conv Autoencoder (5-layer)',
    type: 'Unsupervised + Fusion',
    threshold: 'Val Loss: 0.00385',
    dataset: 'Mendeley Fibroid Dataset (1,742 images)',
    accuracy: 96.2, auc: 0.96, precision: 95.8, recall: 96.5, f1: 96.1,
    color: '#2dd4bf',
    classes: [
      { name: 'Reconstruction Quality', val: 96.2 },
      { name: 'Latent Feature Utility', val: 97.1 },
    ],
    note: 'Denoising ConvAE trained 35 epochs (val loss 0.00385). 512-d latent vector fused with EfficientNetV2-S features to form 1792-d joint representation. AE is frozen during classifier training — acts as a fixed feature extractor capturing ultrasound-specific texture patterns.',
  },
];

const SUMMARY_STATS = [
  { label: 'Total Models', value: '7', icon: '◉', color: '#22d3ee' },
  { label: 'Avg Accuracy', value: '93.3%', icon: '◎', color: '#34d399' },
  { label: 'Avg AUC', value: '0.951', icon: '◈', color: '#a78bfa' },
  { label: 'Datasets Used', value: '5', icon: '◆', color: '#fbbf24' },
];

function BarMeter({ value, color, max = 100 }) {
  return (
    <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function ModelStatsPage() {
  const [selected, setSelected] = useState(MODELS[0]);

  return (
    <div className="page-container" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── PAGE HEADER */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div className="page-title-group">
          <div className="page-breadcrumb">NeuralCore · Platform</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-1)', margin: '0.25rem 0', letterSpacing: '-0.5px' }}>
            Model <span style={{ color: 'var(--violet)' }}>Performance</span>
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-sans)' }}>
            Architecture · Accuracy · AUC · Per-class metrics
          </p>
        </div>
        <div className="page-badges">
          <span className="badge badge-cyan">7 Models</span>
          <span className="badge badge-teal">Production Ready</span>
        </div>
      </div>

      {/* ── SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {SUMMARY_STATS.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: s.color }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1, marginTop: '0.4rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN LAYOUT: model list + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Model list */}
        <div className="card" style={{ padding: '0.5rem' }}>
          {MODELS.map(m => (
            <button key={m.id} onClick={() => setSelected(m)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.85rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: selected.id === m.id ? `color-mix(in srgb, ${m.color} 12%, var(--surface))` : 'transparent',
                borderLeft: selected.id === m.id ? `3px solid ${m.color}` : '3px solid transparent',
                transition: 'all 0.15s', marginBottom: '0.15rem',
              }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: selected.id === m.id ? m.color : 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{m.subtitle}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: m.color, flexShrink: 0 }}>{m.accuracy}%</div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Model header */}
          <div className="card" style={{ padding: '1.5rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `color-mix(in srgb, ${selected.color} 15%, transparent)`, border: `1.5px solid color-mix(in srgb, ${selected.color} 35%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {selected.icon}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.3px' }}>{selected.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: selected.color, background: `color-mix(in srgb, ${selected.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${selected.color} 25%, transparent)`, borderRadius: 4, padding: '0.15rem 0.5rem' }}>{selected.arch}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '0.15rem 0.5rem' }}>{selected.type}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '0.15rem 0.5rem' }}>threshold={selected.threshold}</span>
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>📊</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{selected.dataset}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'ACCURACY', value: `${selected.accuracy}%` },
              { label: 'AUC-ROC', value: selected.auc.toFixed(2) },
              { label: 'PRECISION', value: `${selected.precision}%` },
              { label: 'RECALL', value: `${selected.recall}%` },
              { label: 'F1 SCORE', value: `${selected.f1}%` },
            ].map(m => (
              <div key={m.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: selected.color, lineHeight: 1 }}>{m.value}</div>
                <BarMeter value={parseFloat(m.value)} color={selected.color} max={m.label === 'AUC-ROC' ? 1 : 100} />
              </div>
            ))}
          </div>

          {/* Per-class accuracy */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '1.2rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
              PER-CLASS ACCURACY
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selected.classes.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: selected.color }}>{c.val}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.val}%`, background: `linear-gradient(90deg, ${selected.color}, color-mix(in srgb, ${selected.color} 60%, var(--teal)))`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation notes */}
          <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.67rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '0.6rem' }}>IMPLEMENTATION NOTES</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              {selected.note}
            </p>
          </div>
        </div>
      </div>

      {/* ── ALL MODELS TABLE */}
      <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1.25rem' }}>
          All Models — Performance Overview
        </h3>
        <table className="data-table" style={{ fontFamily: 'var(--font-sans)' }}>
          <thead>
            <tr>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>Model</th>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>Architecture</th>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>Type</th>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>Accuracy</th>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>AUC</th>
              <th style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 1 }}>F1</th>
            </tr>
          </thead>
          <tbody>
            {MODELS.map(m => (
              <tr key={m.id} onClick={() => setSelected(m)} style={{ cursor: 'pointer', background: selected.id === m.id ? `color-mix(in srgb, ${m.color} 6%, transparent)` : undefined }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>{m.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: selected.id === m.id ? m.color : 'var(--text-1)', fontSize: '0.85rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{m.subtitle}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-2)' }}>{m.arch}</td>
                <td><span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: 4, background: `color-mix(in srgb, ${m.color} 10%, transparent)`, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.type}</span></td>
                <td style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: m.color, fontSize: '1rem' }}>{m.accuracy}%</td>
                <td style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: m.color, fontSize: '1rem' }}>{m.auc.toFixed(3)}</td>
                <td style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: m.color, fontSize: '1rem' }}>{m.f1}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="disclaimer" style={{ marginTop: '1.5rem' }}>
        ⚠ Performance metrics are based on validation datasets. Real-world accuracy may vary. All models are intended for clinical decision support only — not standalone diagnosis.
      </div>
    </div>
  );
}
