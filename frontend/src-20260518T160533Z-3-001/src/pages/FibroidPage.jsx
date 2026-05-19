import { useState, useRef, useCallback } from "react"
import axios from "axios"
import "./FibroidPage.css"
import { saveModuleResult } from './CorrelationEngine';

const API = "http://localhost:5000"

const FSI_META = {
  Minimal:  { color: "#48bb78", bg: "rgba(72,187,120,.12)",  icon: "◎" },
  Mild:     { color: "#68d391", bg: "rgba(104,211,145,.12)", icon: "◑" },
  Moderate: { color: "#f6ad55", bg: "rgba(246,173,85,.12)",  icon: "◐" },
  Severe:   { color: "#fc8181", bg: "rgba(252,129,129,.12)", icon: "◉" },
  Critical: { color: "#f56565", bg: "rgba(245,101,101,.15)", icon: "⊗" },
}

const SIZE_META = {
  none:   { label: "—",      color: "#718096" },
  small:  { label: "Small",  color: "#48bb78", sub: "<3 cm" },
  medium: { label: "Medium", color: "#f6ad55", sub: "3–6 cm" },
  large:  { label: "Large",  color: "#fc8181", sub: ">6 cm"  },
}

const LOC_META = {
  none:        { label: "—",           color: "#718096" },
  subserosal:  { label: "Subserosal",  color: "#63b3ed", sub: "Outer wall" },
  intramural:  { label: "Intramural",  color: "#b794f4", sub: "Within muscle" },
  submucosal:  { label: "Submucosal",  color: "#fc8181", sub: "Inner cavity" },
}

const TEX_META = {
  none:          { label: "—",              color: "#718096" },
  homogeneous:   { label: "Homogeneous",    color: "#48bb78" },
  heterogeneous: { label: "Heterogeneous",  color: "#f6ad55" },
  calcified:     { label: "Calcified",      color: "#a0aec0" },
}

export default function FibroidPage() {
  const [file,      setFile]      = useState(null)
  const [preview,   setPreview]   = useState(null)
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [dragOver,  setDragOver]  = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const inputRef  = useRef()
  const resultRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const allowed = ["image/jpeg","image/png","image/webp","image/bmp"]
    if (!allowed.includes(f.type)) { setError("Please upload a JPEG or PNG ultrasound image."); return }
    if (f.size > 15 * 1024 * 1024) { setError("File too large. Max 15 MB."); return }
    setFile(f); setError(null); setResult(null)
    setPreview(URL.createObjectURL(f))
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const handleSubmit = async () => {
    if (!file) { setError("Please upload an ultrasound image first."); return }
    setLoading(true); setError(null); setResult(null)
    const fd = new FormData()
    fd.append("image", file)
    try {
      const { data } = await axios.post(`${API}/predict/fibroid`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      })
      setResult(data)
      try { saveModuleResult("fibroid", data); } catch(e) {}
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 150)
    } catch (e) {
      setError(e.response?.data?.error || "Server error. Is the backend running on port 5000?")
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const fsiMeta = result ? (FSI_META[result.fsi_severity] || FSI_META.Minimal) : null
  const fsiPct  = result ? result.fsi_score : 0

  return (
    <div className="fibroid-page">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="fb-header">
        <div className="fb-icon">⬡</div>
        <div>
          <h1 className="fb-title">Fibroid Detection <span>&amp; Characterization</span></h1>
          <p className="fb-subtitle">
            YOLOv8m · ResNet50 · ConvAutoencoder · MC Dropout · GradCAM++ · FSI Scoring
          </p>
        </div>
      </div>

      <div className="fb-crossmod">
        <span>⬡</span>
        <span>Linked to PCOS &amp; Menstrual modules — overlapping findings are cross-referenced automatically.</span>
      </div>

      <div className="fb-layout">

        {/* ── LEFT: Upload ───────────────────────────────────────────── */}
        <div className="fb-panel fb-upload-panel">
          <div className="fb-phdr">
            <span>🔬</span>
            <div>
              <div className="fb-ptitle">Ultrasound Image</div>
              <div className="fb-psub">Upload pelvic / transvaginal ultrasound</div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`fb-dropzone ${dragOver ? "drag-active" : ""} ${preview ? "has-preview" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <img src={preview} alt="uploaded ultrasound" className="fb-preview-img" />
            ) : (
              <div className="fb-dz-inner">
                <div className="fb-dz-icon">⬡</div>
                <div className="fb-dz-text">Drop ultrasound image here</div>
                <div className="fb-dz-sub">or click to browse · JPEG / PNG · max 15 MB</div>
              </div>
            )}
            <input
              ref={inputRef} type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {file && (
            <div className="fb-file-info">
              <span className="fb-file-name">📎 {file.name}</span>
              <span className="fb-file-size">{(file.size/1024).toFixed(0)} KB</span>
            </div>
          )}

          {/* What the model detects */}
          <div className="fb-capabilities">
            <div className="fb-cap-title">What this model detects</div>
            <div className="fb-cap-grid">
              {[
                ["⬡", "Presence",  "Fibroid vs no fibroid"],
                ["◎", "Count",     "Number of fibroids"],
                ["⬟", "Size",      "Small / Medium / Large"],
                ["◈", "Location",  "Subserosal · Intramural · Submucosal"],
                ["⊗", "Texture",   "Homogeneous · Heterogeneous · Calcified"],
                ["◉", "FSI Score", "0–100 severity index"],
              ].map(([ic, t, s]) => (
                <div key={t} className="fb-cap-item">
                  <span className="fb-cap-ic">{ic}</span>
                  <div><div className="fb-cap-t">{t}</div><div className="fb-cap-s">{s}</div></div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="fb-error">⚠ {error}</div>}

          <div className="fb-actions">
            <button className="btn-analyse-fb" onClick={handleSubmit} disabled={loading || !file}>
              {loading
                ? <><span className="fb-spinner" /> Analysing…</>
                : <>⬡ Analyse Ultrasound</>}
            </button>
            {result && <button className="btn-clr-fb" onClick={handleReset}>✕ Reset</button>}
          </div>
        </div>

        {/* ── RIGHT: Results ─────────────────────────────────────────── */}
        <div className="fb-panel fb-result-panel" ref={resultRef}>
          <div className="fb-phdr">
            <span>📊</span>
            <div>
              <div className="fb-ptitle">Detection Report</div>
              <div className="fb-psub">YOLOv8 · ResNet50 · MC Dropout · FSI</div>
            </div>
          </div>

          {!result && !loading && (
            <div className="fb-placeholder">
              <div className="fb-ph-ring"><span>⬡</span></div>
              <p>Upload and analyse an ultrasound image to begin</p>
              <p className="fb-ph-sub">Detection · Size · Location · Texture · FSI · Growth Projection</p>
            </div>
          )}

          {loading && (
            <div className="fb-placeholder">
              <div className="fb-loading-ring" />
              <p>Running fibroid analysis pipeline…</p>
              <p className="fb-ph-sub">YOLO → ResNet → MC Dropout → FSI → Clinical Reasoning</p>
            </div>
          )}

          {result && fsiMeta && (
            <div className="fb-result-content">

              {/* STATE 1: No models at all — show setup instructions */}
              {!result.models_loaded && result.model_used === "rule_engine" ? (
                <div className="fb-models-pending">
                  <div className="fb-mp-icon">⬡</div>
                  <div className="fb-mp-title">Awaiting Trained Models</div>
                  <div className="fb-mp-sub">
                    The Fibroid AI pipeline requires 3 trained model files.
                    Complete Kaggle training first, then place these in <code>backend/models/</code>:
                  </div>
                  <div className="fb-mp-files">
                    <div className="fb-mp-file"><span className="fb-mp-dot">○</span><code>fibroid_yolo.pt</code><span className="fb-mp-desc">YOLOv8 detection weights</span></div>
                    <div className="fb-mp-file"><span className="fb-mp-dot">○</span><code>fibroid_resnet.pt</code><span className="fb-mp-desc">ResNet50 + Autoencoder classifier</span></div>
                    <div className="fb-mp-file"><span className="fb-mp-dot">○</span><code>fibroid_autoencoder.pt</code><span className="fb-mp-desc">ConvAutoencoder weights</span></div>
                  </div>
                  <div className="fb-mp-steps">
                    <div className="fb-mp-step"><span>1</span> Run <code>train_fibroid.py</code> on Kaggle GPU</div>
                    <div className="fb-mp-step"><span>2</span> Download 3 <code>.pt</code> files from <code>/kaggle/working/fibroid_output/</code></div>
                    <div className="fb-mp-step"><span>3</span> Copy to <code>backend/models/</code> and restart Flask</div>
                    <div className="fb-mp-step"><span>4</span> Re-upload this image — full detection will run</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* STATE 2: YOLO-only — show partial results banner */}
                  {!result.models_loaded && result.model_used === "yolov8_only" && (
                    <div className="fb-yolo-only-banner">
                      <span>⬡</span>
                      <div>
                        <div className="fb-yob-title">YOLO Detection Active — Characterization Pending</div>
                        <div className="fb-yob-sub">
                          Detection result below is from YOLOv8 only (conf ≥ 50%).
                          Add <code>fibroid_resnet.pt</code> + <code>fibroid_autoencoder.pt</code> for size, location, texture &amp; FSI.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STATE 3: Detection banner — YOLO-only or full pipeline */}
                  <div className={`fb-det-banner ${result.detection === "Fibroid Detected" && result.num_fibroids > 0 ? "positive" : "negative"}`}>
                    <span className="fb-det-icon">
                      {result.detection === "Fibroid Detected" ? "⊗" : "◎"}
                    </span>
                    <div>
                      <div className="fb-det-label">{result.detection === "Fibroid Detected" && result.num_fibroids > 0 ? "Fibroid Detected" : "No Fibroid Detected"}</div>
                      <div className="fb-det-sub">
                        {result.detection === "Fibroid Detected"
                          ? `${result.num_fibroids} fibroid(s) · conf ${(result.detection_conf*100).toFixed(1)}%`
                            + (result.uncertainty ? ` · uncertainty σ=${result.uncertainty}` : "")
                          : "No fibroid structures identified in this ultrasound"}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tabs */}
              {result.detection === "Fibroid Detected" && result.num_fibroids > 0 && result.model_used !== "rule_engine" && (
                <>
                  <div className="fb-tabs">
                    {["overview","gradcam","growth","clinical"].map(t => (
                      <button key={t}
                        className={`fb-tab ${activeTab===t?"active":""}`}
                        onClick={() => setActiveTab(t)}>
                        {t === "overview" ? "◎ Overview"
                          : t === "gradcam"  ? "⬡ GradCAM"
                          : t === "growth"   ? "◈ Growth"
                          : "⊗ Clinical"}
                      </button>
                    ))}
                  </div>

                  {/* ── TAB: OVERVIEW ─────────────────────────────────────── */}
                  {activeTab === "overview" && (
                    <div className="fb-tab-content">

                      {/* Characterization cards */}
                      <div className="fb-char-grid">
                        {[
                          { label: "SIZE",     val: SIZE_META[result.size]?.label,     sub: SIZE_META[result.size]?.sub,     conf: result.size_conf,     color: SIZE_META[result.size]?.color },
                          { label: "LOCATION", val: LOC_META[result.location]?.label,  sub: LOC_META[result.location]?.sub,  conf: result.location_conf, color: LOC_META[result.location]?.color },
                          { label: "TEXTURE",  val: TEX_META[result.texture]?.label,   sub: undefined,                       conf: result.texture_conf,  color: TEX_META[result.texture]?.color },
                        ].map(c => (
                          <div key={c.label} className="fb-char-card" style={{ borderColor: c.color }}>
                            <div className="fb-char-lbl">{c.label}</div>
                            <div className="fb-char-val" style={{ color: c.color }}>{c.val}</div>
                            {c.sub && <div className="fb-char-sub">{c.sub}</div>}
                            <div className="fb-char-conf">{(c.conf*100).toFixed(1)}% conf</div>
                          </div>
                        ))}
                      </div>

                      {/* FSI Score */}
                      <div className="fb-fsi-card" style={{ borderColor: fsiMeta.color, background: fsiMeta.bg }}>
                        <div className="fb-fsi-top">
                          <span className="fb-fsi-label">FIBROID SEVERITY INDEX</span>
                          <span className="fb-fsi-sev" style={{ color: fsiMeta.color }}>
                            {fsiMeta.icon} {result.fsi_severity}
                          </span>
                        </div>
                        <div className="fb-fsi-score" style={{ color: fsiMeta.color }}>
                          {result.fsi_score}<span className="fb-fsi-denom">/100</span>
                        </div>
                        <div className="fb-fsi-bar-bg">
                          <div className="fb-fsi-bar-fill"
                            style={{ width: `${fsiPct}%`, background: fsiMeta.color }} />
                        </div>
                        <div className="fb-fsi-ticks">
                          {["Minimal","Mild","Moderate","Severe","Critical"].map(s => (
                            <span key={s} style={{ color: result.fsi_severity===s ? fsiMeta.color : "#4a5568" }}>{s}</span>
                          ))}
                        </div>
                      </div>

                      {/* Uncertainty */}
                      <div className={`fb-unc ${result.uncertainty > 0.15 ? "high-unc" : "low-unc"}`}>
                        <span className="fb-unc-icon">{result.uncertainty > 0.15 ? "⚠" : "✓"}</span>
                        <div>
                          <div className="fb-unc-title">
                            MC Dropout Uncertainty: σ = {result.uncertainty}
                            {result.uncertainty > 0.15 ? " — Moderate Uncertainty" : " — High Confidence"}
                          </div>
                          <div className="fb-unc-sub">
                            {result.uncertainty > 0.15
                              ? "Image quality or atypical presentation. Repeat imaging recommended."
                              : "20 stochastic forward passes — consistent predictions."}
                          </div>
                        </div>
                      </div>

                      {/* YOLO annotated image */}
                      {result.annotated_image && (
                        <div className="fb-annot-wrap">
                          <div className="fb-sec-label">YOLO DETECTION OUTPUT</div>
                          <img src={`data:image/jpeg;base64,${result.annotated_image}`}
                            alt="YOLO annotated" className="fb-annot-img" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: GRADCAM ──────────────────────────────────────── */}
                  {activeTab === "gradcam" && (
                    <div className="fb-tab-content">
                      <div className="fb-sec-label">GRAD-CAM++ EXPLAINABILITY</div>
                      <p className="fb-gradcam-desc">
                        GradCAM++ applied on the YOLO-cropped fibroid region.
                        Red = highest model activation (where it found the fibroid).
                        Blue = background / low relevance.
                      </p>
                      {result.gradcam_image ? (
                        <div className="fb-gradcam-grid">
                          <div className="fb-gc-panel">
                            <div className="fb-gc-label">Original Ultrasound</div>
                            <img src={preview} alt="original" className="fb-gc-img" />
                          </div>
                          <div className="fb-gc-panel">
                            <div className="fb-gc-label">Fibroid ROI Crop</div>
                            <img src={`data:image/jpeg;base64,${result.roi_image}`}
                              alt="ROI crop" className="fb-gc-img fb-gc-border" />
                          </div>
                          <div className="fb-gc-panel">
                            <div className="fb-gc-label">Grad-CAM Explainability</div>
                            <img src={`data:image/jpeg;base64,${result.gradcam_image}`}
                              alt="GradCAM" className="fb-gc-img" />
                          </div>
                        </div>
                      ) : (
                        <div className="fb-gc-na">GradCAM map not available for this image.</div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: GROWTH ───────────────────────────────────────── */}
                  {activeTab === "growth" && result.growth_12m && (
                    <div className="fb-tab-content">
                      <div className="fb-sec-label">12-MONTH GROWTH PROJECTION</div>
                      <div className="fb-growth-meta">
                        <span>Initial size: <strong>{result.growth_12m[0]?.size_cm} cm</strong></span>
                        <span>At 3 months: <strong>{result.growth_12m[2]?.size_cm} cm</strong></span>
                        <span>At 12 months: <strong>{result.growth_12m[11]?.size_cm} cm</strong></span>
                      </div>
                      <div className="fb-growth-bars">
                        {[1,3,6,9,12].map(m => {
                          const proj = result.growth_12m[m-1]
                          const pct  = Math.min((proj.size_cm / 12) * 100, 100)
                          const col  = proj.category === "small" ? "#48bb78"
                                     : proj.category === "medium" ? "#f6ad55" : "#fc8181"
                          return (
                            <div key={m} className="fb-growth-row">
                              <span className="fb-gr-month">Month {m}</span>
                              <div className="fb-gr-bar-bg">
                                <div className="fb-gr-bar-fill"
                                  style={{ width: `${pct}%`, background: col }} />
                              </div>
                              <span className="fb-gr-val" style={{ color: col }}>
                                {proj.size_cm} cm
                              </span>
                              <span className="fb-gr-cat" style={{ color: col }}>
                                {proj.category}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="fb-growth-note">
                        ⚠ Projection assumes no treatment. Based on Baird et al. (2011) growth rate data.
                        Hormonal therapy reduces growth by ~70%.
                      </div>
                    </div>
                  )}

                  {/* ── TAB: CLINICAL ─────────────────────────────────────── */}
                  {activeTab === "clinical" && result.clinical && (
                    <div className="fb-tab-content">

                      {/* Urgency */}
                      <div className={`fb-urgency ${result.clinical.urgency === "Urgent" ? "urg-urgent"
                        : result.clinical.urgency.includes("Soon") ? "urg-soon" : "urg-routine"}`}>
                        <span className="fb-urg-ic">
                          {result.clinical.urgency === "Urgent" ? "⊗"
                           : result.clinical.urgency.includes("Soon") ? "◉" : "◎"}
                        </span>
                        <div>
                          <div className="fb-urg-label">CLINICAL URGENCY</div>
                          <div className="fb-urg-val">{result.clinical.urgency}</div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="fb-clin-summary">
                        <div className="fb-sec-label">CLINICAL SUMMARY</div>
                        <p>{result.clinical.summary}</p>
                      </div>

                      {/* Red flags */}
                      {result.clinical.red_flags?.length > 0 && (
                        <div className="fb-red-flags">
                          <div className="fb-sec-label">⚠ RED FLAGS</div>
                          {result.clinical.red_flags.map((rf, i) => (
                            <div key={i} className="fb-rf-item">⚠ {rf}</div>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="fb-recs">
                        <div className="fb-sec-label">MANAGEMENT RECOMMENDATIONS</div>
                        {result.clinical.recommendations.map((r, i) => (
                          <div key={i} className="fb-rec">
                            <span className="fb-rec-n">{String(i+1).padStart(2,"0")}</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="fb-disclaimer">
                        ⚠ Research use only. Not a substitute for clinical gynaecological evaluation.
                        References: FIGO 2011, ACOG PB-96, NICE NG88.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* No fibroid — simple recommendations */}
              {result.detection === "No Fibroid" && (
                <div className="fb-no-fibroid">
                  <div className="fb-nf-icon">◎</div>
                  <div className="fb-nf-title">No Fibroid Structures Detected</div>
                  <div className="fb-nf-sub">Normal ultrasound appearance. Routine follow-up advised.</div>
                  <div className="fb-recs">
                    <div className="fb-sec-label">RECOMMENDATIONS</div>
                    {(result.clinical?.recommendations || [
                      "Annual ultrasound surveillance recommended.",
                      "Report new symptoms (heavy bleeding, pelvic pain) promptly.",
                    ]).map((r,i) => (
                      <div key={i} className="fb-rec">
                        <span className="fb-rec-n">{String(i+1).padStart(2,"0")}</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
