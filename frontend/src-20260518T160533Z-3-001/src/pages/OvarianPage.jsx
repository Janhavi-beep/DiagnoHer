import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { saveModuleResult } from './CorrelationEngine';
import "./OvarianPage.css";

// ── Constants ──────────────────────────────────────────────────────────────────
const OVARIAN_CLASSES = [
  { key: "normal",         label: "Normal Tissue",       color: "#48bb78", icon: "✦" },
  { key: "chocolate_cyst", label: "Chocolate Cyst",      color: "#ed8936", icon: "◈" },
  { key: "dermoid_cyst",   label: "Dermoid Cyst",        color: "#b794f4", icon: "◉" },
  { key: "follicle",       label: "Follicular Cyst",     color: "#63b3ed", icon: "◎" },
  { key: "serous_cyst",    label: "Serous Cyst",         color: "#fc8181", icon: "◇" },
];

const CLASS_DESCRIPTIONS = {
  normal:         "No pathological findings. Healthy ovarian morphology detected.",
  chocolate_cyst: "Endometrioma suspected. Blood-filled cyst associated with endometriosis.",
  dermoid_cyst:   "Teratoma suspected. May contain mixed tissue types. Surgical review recommended.",
  follicle:       "Functional follicular cyst detected. Often resolves spontaneously.",
  serous_cyst:    "Serous cystadenoma pattern. Monitor for size progression.",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const getClassMeta = (typeKey) =>
  OVARIAN_CLASSES.find((c) => c.key === typeKey?.toLowerCase().replace(" ", "_")) ||
  OVARIAN_CLASSES[0];

const ConfidenceBar = ({ label, value, color, isTop }) => (
  <div className={`conf-row ${isTop ? "conf-top" : ""}`}>
    <span className="conf-label">{label}</span>
    <div className="conf-track">
      <div
        className="conf-fill"
        style={{
          width: `${Math.round(value * 100)}%`,
          background: color,
          boxShadow: isTop ? `0 0 10px ${color}80` : "none",
        }}
      />
    </div>
    <span className="conf-pct" style={{ color: isTop ? color : undefined }}>
      {(value * 100).toFixed(1)}%
    </span>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const OvarianPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview]           = useState(null);
  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [dragging, setDragging]         = useState(false);
  const fileInputRef                    = useRef(null);

  // ── File handling ──────────────────────────────────────────────────────────
  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, DICOM-export).");
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

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── API call ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedFile) { setError("Please upload an ultrasound scan first."); return; }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const resp = await axios.post("http://127.0.0.1:5000/predict", formData);
      const resultData = resp.data.ovarian_analysis;
      setData(resultData);
      try { saveModuleResult("ovarian", resultData); } catch(e) {}
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Backend connection failed. Ensure the Flask server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setData(null);
    setError(null);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const topClass   = data ? getClassMeta(data.type) : null;
  const confidence = data?.confidence
    ? typeof data.confidence === "string"
      ? parseFloat(data.confidence) / 100
      : data.confidence
    : null;

  // all_scores is an optional dict from backend: { normal: 0.02, chocolate_cyst: 0.91, ... }
  const allScores = data?.all_scores || null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ov-page">
      {/* Ambient background */}
      <div className="ov-bg" aria-hidden="true">
        <div className="ov-orb ov-orb-1" />
        <div className="ov-orb ov-orb-2" />
        <div className="ov-grid" />
      </div>

      {/* Header */}
      <div className="ov-topbar">
        <Link to="/" className="ov-back">
          <span>←</span> Module Selection
        </Link>
        <div className="ov-module-badge">
          <span className="ov-badge-dot" />
          Ovarian Pathology Lab · 5-Class Differential
        </div>
      </div>

      <div className="ov-layout">

        {/* ── Left: Upload panel ── */}
        <aside className="ov-panel ov-upload-panel">
          <div className="ov-panel-header">
            <span className="ov-panel-icon">🔬</span>
            <div>
              <h2>Scan Input</h2>
              <p>Ultrasound / DICOM export</p>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`ov-dropzone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {preview ? (
              <img src={preview} className="ov-preview" alt="Uploaded scan" />
            ) : (
              <div className="ov-drop-prompt">
                <div className="ov-drop-icon">⬆</div>
                <p>Drop ultrasound scan here</p>
                <span>or click to browse · PNG / JPG / DICOM</span>
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
            <div className="ov-file-meta">
              <span>📁 {selectedFile.name}</span>
              <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {error && (
            <div className="ov-error">
              <span>⚠</span> {error}
            </div>
          )}

          <div className="ov-actions">
            <button
              className={`ov-btn ov-btn-primary ${loading ? "loading" : ""}`}
              onClick={handleGenerate}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="ov-spinner" /> Classifying Tissue…
                </>
              ) : (
                "▶  Run Diagnostic Lab"
              )}
            </button>
            {(selectedFile || data) && (
              <button className="ov-btn ov-btn-ghost" onClick={handleReset}>
                ✕ Reset
              </button>
            )}
          </div>

          {/* Class legend */}
          <div className="ov-legend">
            <p className="ov-legend-title">Detectable Classes</p>
            {OVARIAN_CLASSES.map((c) => (
              <div key={c.key} className="ov-legend-row">
                <span className="ov-legend-dot" style={{ background: c.color }} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Right: Results panel ── */}
        <main className="ov-panel ov-results-panel">
          <div className="ov-panel-header">
            <span className="ov-panel-icon">📋</span>
            <div>
              <h2>Pathology Report</h2>
              <p>Neural-Core Multi-Class v3.2 Engine</p>
            </div>
            {data && (
              <div className="ov-report-timestamp">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>

          {!data && !loading && (
            <div className="ov-placeholder">
              <div className="ov-placeholder-icon">◎</div>
              <p>Awaiting scan for differential tissue analysis…</p>
              <span>Upload an ovarian ultrasound scan and run the diagnostic lab.</span>
            </div>
          )}

          {loading && (
            <div className="ov-loading-state">
              <div className="ov-pulse-ring" />
              <p>Analysing tissue morphology…</p>
              <span>Running 5-class ResNet inference</span>
            </div>
          )}

          {data && topClass && (
            <div className="ov-report">

              {/* Diagnosis pill */}
              <div className="ov-diagnosis-block" style={{ "--accent": topClass.color }}>
                <div className="ov-diagnosis-icon" style={{ color: topClass.color }}>
                  {topClass.icon}
                </div>
                <div>
                  <div className="ov-diagnosis-label">Primary Diagnosis</div>
                  <div className="ov-diagnosis-name" style={{ color: topClass.color }}>
                    {data.diagnosis || topClass.label}
                  </div>
                </div>
                {confidence !== null && (
                  <div className="ov-conf-badge" style={{ borderColor: topClass.color, color: topClass.color }}>
                    {(confidence * 100).toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Clinical description */}
              <div className="ov-clinical-note">
                <span className="ov-note-tag">Clinical Note</span>
                <p>{CLASS_DESCRIPTIONS[topClass.key]}</p>
              </div>

              {/* Confidence breakdown */}
              {allScores ? (
                <div className="ov-conf-section">
                  <h4>Class Probability Distribution</h4>
                  {OVARIAN_CLASSES.map((c) => (
                    <ConfidenceBar
                      key={c.key}
                      label={c.label}
                      value={allScores[c.key] ?? 0}
                      color={c.color}
                      isTop={c.key === topClass.key}
                    />
                  ))}
                </div>
              ) : confidence !== null && (
                <div className="ov-conf-section">
                  <h4>Model Confidence</h4>
                  <ConfidenceBar
                    label={topClass.label}
                    value={confidence}
                    color={topClass.color}
                    isTop
                  />
                </div>
              )}

              {/* Metrics row */}
              <div className="ov-metrics-row">
                <div className="ov-metric">
                  <span className="ov-metric-label">Classification</span>
                  <span className="ov-metric-val">{data.type}</span>
                </div>
                <div className="ov-metric">
                  <span className="ov-metric-label">Engine</span>
                  <span className="ov-metric-val">ResNet v3.2</span>
                </div>
                <div className="ov-metric">
                  <span className="ov-metric-label">Classes</span>
                  <span className="ov-metric-val">5-Class Diff.</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="ov-disclaimer">
                ⚠ For research use only. Not a substitute for clinical histopathology or specialist review.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OvarianPage;
