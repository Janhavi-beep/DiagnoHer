import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { saveModuleResult } from './CorrelationEngine';
import "./PCOSPage.css";

// ── Rotterdam Criteria thresholds ──────────────────────────────────────────────
const ROTTERDAM_CRITERIA = [
  {
    key: "follicle_count",
    label: "Follicle Count",
    threshold: "≥ 12 follicles",
    unit: "follicles",
    icon: "◎",
    check: (val) => parseInt(val) >= 12,
  },
  {
    key: "pcos_risk",
    label: "Clinical Risk",
    threshold: "High / Moderate",
    unit: "",
    icon: "⬡",
    check: (val) => ["high", "moderate"].includes(val?.toLowerCase()),
  },
];

const RISK_META = {
  high:     { color: "#fc8181", label: "High Risk",     bg: "rgba(252,129,129,0.08)" },
  moderate: { color: "#ed8936", label: "Moderate Risk", bg: "rgba(237,137,54,0.08)"  },
  low:      { color: "#48bb78", label: "Low Risk",      bg: "rgba(72,187,120,0.08)"  },
  normal:   { color: "#48bb78", label: "Normal",        bg: "rgba(72,187,120,0.08)"  },
};

const getRiskMeta = (risk) =>
  RISK_META[risk?.toLowerCase()] || { color: "#63b3ed", label: risk, bg: "rgba(99,179,237,0.08)" };

// ── Sub-components ─────────────────────────────────────────────────────────────
const FollicleGauge = ({ count }) => {
  const max    = 24;
  const pct    = Math.min((count / max) * 100, 100);
  const thresh = (12 / max) * 100;
  const color  = count >= 12 ? "#fc8181" : "#48bb78";

  return (
    <div className="pcos-gauge">
      <div className="gauge-labels">
        <span>0</span>
        <span style={{ color: "#ed8936", fontSize: "0.65rem" }}>threshold: 12</span>
        <span>{max}+</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-threshold" style={{ left: `${thresh}%` }} />
        <div
          className="gauge-fill"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}60` }}
        />
      </div>
      <div className="gauge-val" style={{ color }}>
        {count} <span>follicles detected</span>
      </div>
    </div>
  );
};

const CriterionRow = ({ label, icon, threshold, met }) => (
  <div className={`pcos-criterion ${met ? "met" : "unmet"}`}>
    <span className="crit-icon">{icon}</span>
    <div className="crit-body">
      <span className="crit-label">{label}</span>
      <span className="crit-threshold">{threshold}</span>
    </div>
    <span className="crit-status">{met ? "✓ Met" : "✗ Not met"}</span>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const PCOSPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [xaiExpanded,  setXaiExpanded]  = useState(false);
  const fileInputRef                    = useRef(null);

  // ── File ──────────────────────────────────────────────────────────────────
  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG).");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setData(null);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files[0]);
  }, []);

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setData(null);
    setError(null);
    setXaiExpanded(false);
  };

  // ── API ───────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFile) { setError("Please upload an ultrasound scan first."); return; }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const resp = await axios.post("http://127.0.0.1:5000/predict", formData);
      const resultData = {
        ...resp.data.pcos_analysis,
        detection_image:  resp.data.detection_image,
        ovarian_analysis: resp.data.ovarian_analysis,
      };
      setData(resultData);
      try { saveModuleResult("pcos", resultData); } catch(e) {}
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Backend connection failed. Ensure Flask is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const riskMeta      = data ? getRiskMeta(data.pcos_risk) : null;
  const follicleCount = data ? parseInt(data.follicle_count) || 0 : 0;
  const criteriaCount = data
    ? ROTTERDAM_CRITERIA.filter((c) => c.check(data[c.key])).length
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pcos-page">
      {/* Ambient */}
      <div className="pcos-bg" aria-hidden="true">
        <div className="pcos-orb pcos-orb-1" />
        <div className="pcos-orb pcos-orb-2" />
        <div className="pcos-grid" />
      </div>

      {/* Top bar */}
      <div className="pcos-topbar">
        <Link to="/" className="pcos-back">← Module Selection</Link>
        <div className="pcos-module-badge">
          <span className="pcos-badge-dot" />
          PCOS Detection · Rotterdam Criteria
        </div>
      </div>

      <div className="pcos-layout">

        {/* ── Left: Upload ── */}
        <aside className="pcos-panel pcos-upload-panel">
          <div className="pcos-panel-header">
            <span className="pcos-panel-icon">🧬</span>
            <div>
              <h2>Scan Input</h2>
              <p>Ovarian ultrasound · DICOM export</p>
            </div>
          </div>

          <div
            className={`pcos-dropzone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
          >
            {preview ? (
              <img src={preview} className="pcos-preview" alt="Uploaded scan" />
            ) : (
              <div className="pcos-drop-prompt">
                <div className="pcos-drop-icon">⬆</div>
                <p>Drop ultrasound scan here</p>
                <span>or click to browse · PNG / JPG</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => applyFile(e.target.files[0])}
          />

          {selectedFile && (
            <div className="pcos-file-meta">
              <span>📁 {selectedFile.name}</span>
              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {error && <div className="pcos-error"><span>⚠</span> {error}</div>}

          <div className="pcos-actions">
            <button
              className={`pcos-btn pcos-btn-primary ${loading ? "loading" : ""}`}
              onClick={handleGenerate}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <><span className="pcos-spinner" /> Counting Follicles…</>
              ) : (
                "▶  Run Neural Analysis"
              )}
            </button>
            {(selectedFile || data) && (
              <button className="pcos-btn pcos-btn-ghost" onClick={handleReset}>✕</button>
            )}
          </div>

          {/* Info box */}
          <div className="pcos-info-box">
            <div className="pcos-info-title">Rotterdam Criteria</div>
            <p>PCOS is diagnosed when 2 of 3 criteria are met: oligo-anovulation, clinical/biochemical hyperandrogenism, or polycystic ovarian morphology (≥ 12 follicles or ovarian volume ≥ 10 mL).</p>
          </div>
        </aside>

        {/* ── Right: Results ── */}
        <main className="pcos-panel pcos-results-panel">
          <div className="pcos-panel-header">
            <span className="pcos-panel-icon">🩺</span>
            <div>
              <h2>Diagnostic Intelligence</h2>
              <p>Neural-Core PCOS Engine · XAI Enabled</p>
            </div>
            {data && (
              <div className="pcos-timestamp">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>

          {/* Empty */}
          {!data && !loading && (
            <div className="pcos-placeholder">
              <div className="pcos-placeholder-icon">◎</div>
              <p>Awaiting scan for follicle segmentation…</p>
              <span>Upload an ovarian ultrasound and run the neural analysis.</span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="pcos-loading-state">
              <div className="pcos-pulse-ring" />
              <p>Segmenting follicles…</p>
              <span>Running Rotterdam criteria evaluation</span>
            </div>
          )}

          {/* Results */}
          {data && riskMeta && (
            <div className="pcos-report">

              {/* Status banner */}
              <div className="pcos-status-banner" style={{ "--risk-color": riskMeta.color, background: riskMeta.bg, borderColor: `${riskMeta.color}30` }}>
                <div className="pcos-status-left">
                  <span className="pcos-status-dot" style={{ background: riskMeta.color, boxShadow: `0 0 8px ${riskMeta.color}` }} />
                  <div>
                    <div className="pcos-status-sub">Diagnosis</div>
                    <div className="pcos-status-label" style={{ color: riskMeta.color }}>
                      {data.status || riskMeta.label}
                    </div>
                  </div>
                </div>
                <div className="pcos-criteria-badge">
                  <span style={{ color: riskMeta.color }}>{criteriaCount}</span>
                  <span>/2</span>
                  <div className="pcos-criteria-sub">criteria met</div>
                </div>
              </div>

              {/* Follicle gauge */}
              <div className="pcos-section">
                <div className="pcos-section-title">Follicle Quantification</div>
                <FollicleGauge count={follicleCount} />
              </div>

              {/* Rotterdam criteria checklist */}
              <div className="pcos-section">
                <div className="pcos-section-title">Rotterdam Criteria Evaluation</div>
                {ROTTERDAM_CRITERIA.map((c) => (
                  <CriterionRow
                    key={c.key}
                    label={c.label}
                    icon={c.icon}
                    threshold={c.threshold}
                    met={c.check(data[c.key])}
                  />
                ))}
              </div>

              {/* Metrics row */}
              <div className="pcos-metrics-row">
                <div className="pcos-metric">
                  <span className="pcos-metric-label">Follicle Count</span>
                  <span className="pcos-metric-val" style={{ color: follicleCount >= 12 ? "#fc8181" : "#48bb78" }}>
                    {data.follicle_count}
                  </span>
                </div>
                <div className="pcos-metric">
                  <span className="pcos-metric-label">Risk Level</span>
                  <span className="pcos-metric-val" style={{ color: riskMeta.color }}>{data.pcos_risk}</span>
                </div>
                <div className="pcos-metric">
                  <span className="pcos-metric-label">XAI Map</span>
                  <span className="pcos-metric-val">{data.detection_image ? "Available" : "N/A"}</span>
                </div>
              </div>

              {/* XAI Neural Map */}
              {data.detection_image && (
                <div className="pcos-xai-section">
                  <button
                    className="pcos-xai-toggle"
                    onClick={() => setXaiExpanded((v) => !v)}
                  >
                    <span>⬡</span>
                    Neural Mapping (XAI)
                    <span className="pcos-xai-chevron">{xaiExpanded ? "▲" : "▼"}</span>
                  </button>
                  {xaiExpanded && (
                    <div className="pcos-xai-body">
                      <img src={data.detection_image} className="pcos-xai-img" alt="XAI Neural Map" />
                      <p className="pcos-xai-caption">
                        Gradient-weighted Class Activation Map (Grad-CAM) highlighting regions contributing to the diagnostic decision.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pcos-disclaimer">
                ⚠ For research use only. Not a substitute for clinical evaluation or specialist review.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PCOSPage;
