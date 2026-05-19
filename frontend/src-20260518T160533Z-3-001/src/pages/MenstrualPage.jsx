import { useState, useRef } from "react"
import axios from "axios"
import "./MenstrualPage.css"
import { saveModuleResult } from './CorrelationEngine';

const API = "http://localhost:5000"

const SYMPTOM_OPTIONS = [
  { id: "cramping",       label: "Severe Cramping"        },
  { id: "bloating",       label: "Bloating"               },
  { id: "spotting",       label: "Spotting Between Cycles"},
  { id: "clotting",       label: "Heavy Clotting"         },
  { id: "mood_swings",    label: "Mood Swings"            },
  { id: "fatigue",        label: "Fatigue"                },
  { id: "acne",           label: "Hormonal Acne"          },
  { id: "hair_loss",      label: "Hair Thinning / Loss"   },
]

const CLASSIFICATION_META = {
  normal:         { color: "#48bb78", icon: "◉", label: "Normal Cycle"              },
  oligomenorrhea: { color: "#ed8936", icon: "◎", label: "Oligomenorrhea"            },
  amenorrhea:     { color: "#fc8181", icon: "⊗", label: "Amenorrhea"               },
  polymenorrhea:  { color: "#f6ad55", icon: "◈", label: "Polymenorrhea"            },
  menorrhagia:    { color: "#fc8181", icon: "◉", label: "Menorrhagia"              },
  dysmenorrhea:   { color: "#b794f4", icon: "◎", label: "Dysmenorrhea"             },
  pcos_linked:    { color: "#63b3ed", icon: "⬡", label: "PCOS-Linked Irregularity" },
}

const SEVERITY_COLOR = {
  Low:      "#48bb78",
  Moderate: "#ed8936",
  High:     "#fc8181",
}

export default function MenstrualPage() {
  const [form, setForm] = useState({
    cycle_length:    "",
    period_duration: "",
    last_period_days:"",
    flow_heaviness:  3,
    pain_level:      1,
    symptoms:        [],
    age:             "",
    known_pcos:      false,
  })
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const resultRef = useRef(null)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleSymptom = (id) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(id)
        ? f.symptoms.filter(s => s !== id)
        : [...f.symptoms, id],
    }))
  }

  const handleSubmit = async () => {
    if (!form.cycle_length || !form.period_duration || !form.last_period_days) {
      setError("Please fill in all required fields.")
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const { data } = await axios.post(`${API}/predict/menstrual`, form)
      setResult(data)
      try { saveModuleResult("menstrual", data); } catch(e) {}
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (e) {
      setError(e.response?.data?.error || "Server error. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setForm({
      cycle_length: "", period_duration: "", last_period_days: "",
      flow_heaviness: 3, pain_level: 1, symptoms: [], age: "", known_pcos: false,
    })
    setResult(null)
    setError(null)
  }

  const meta = result ? (CLASSIFICATION_META[result.classification] || CLASSIFICATION_META.normal) : null

  return (
    <div className="menstrual-page">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="menstrual-header">
        <div className="menstrual-header-icon">⬡</div>
        <div>
          <h1 className="menstrual-title">Menstrual Irregularity <span>Classification</span></h1>
          <p className="menstrual-subtitle">
            Cycle Intelligence Engine · Rule-Based XAI · 6-Class Differential
          </p>
        </div>
      </div>

      <div className="menstrual-layout">

        {/* ══ LEFT — INPUT FORM ══════════════════════════════════════════ */}
        <div className="menstrual-panel menstrual-input-panel">
          <div className="panel-header">
            <span className="panel-icon">📋</span>
            <div>
              <div className="panel-title">Cycle Data Input</div>
              <div className="panel-sub">Clinical parameters · Symptom profile</div>
            </div>
          </div>

          {/* ── Core metrics ─────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-label">CYCLE METRICS</div>
            <div className="form-row-3">
              <div className="form-field">
                <label>Avg Cycle Length <span className="req">*</span></label>
                <div className="input-unit-wrap">
                  <input
                    type="number" min="10" max="120"
                    placeholder="28"
                    value={form.cycle_length}
                    onChange={e => update("cycle_length", e.target.value)}
                  />
                  <span className="unit">days</span>
                </div>
              </div>
              <div className="form-field">
                <label>Period Duration <span className="req">*</span></label>
                <div className="input-unit-wrap">
                  <input
                    type="number" min="1" max="21"
                    placeholder="5"
                    value={form.period_duration}
                    onChange={e => update("period_duration", e.target.value)}
                  />
                  <span className="unit">days</span>
                </div>
              </div>
              <div className="form-field">
                <label>Last Period <span className="req">*</span></label>
                <div className="input-unit-wrap">
                  <input
                    type="number" min="0" max="365"
                    placeholder="14"
                    value={form.last_period_days}
                    onChange={e => update("last_period_days", e.target.value)}
                  />
                  <span className="unit">days ago</span>
                </div>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>Age</label>
                <div className="input-unit-wrap">
                  <input
                    type="number" min="10" max="60"
                    placeholder="25"
                    value={form.age}
                    onChange={e => update("age", e.target.value)}
                  />
                  <span className="unit">yrs</span>
                </div>
              </div>
              <div className="form-field">
                <label>Known PCOS Diagnosis</label>
                <div className="toggle-wrap">
                  <button
                    className={`toggle-btn ${form.known_pcos ? "active" : ""}`}
                    onClick={() => update("known_pcos", !form.known_pcos)}
                  >
                    <span className="toggle-knob" />
                  </button>
                  <span className="toggle-label">{form.known_pcos ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sliders ──────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-label">CLINICAL SCORING</div>

            <div className="form-field">
              <label>
                Flow Heaviness
                <span className="slider-val" style={{ color: `hsl(${120 - form.flow_heaviness * 20}, 70%, 60%)` }}>
                  {["", "Spotting", "Light", "Normal", "Heavy", "Very Heavy"][form.flow_heaviness]}
                </span>
              </label>
              <div className="slider-track-wrap">
                <span className="slider-min">1</span>
                <input type="range" min="1" max="5" value={form.flow_heaviness}
                  onChange={e => update("flow_heaviness", +e.target.value)}
                  className="menstrual-slider flow-slider"
                  style={{ "--pct": `${(form.flow_heaviness - 1) / 4 * 100}%` }}
                />
                <span className="slider-max">5</span>
              </div>
            </div>

            <div className="form-field">
              <label>
                Pain Level
                <span className="slider-val" style={{ color: `hsl(${120 - form.pain_level * 11}, 70%, 60%)` }}>
                  {form.pain_level}/10
                  {form.pain_level <= 2 ? " · None" : form.pain_level <= 4 ? " · Mild"
                    : form.pain_level <= 6 ? " · Moderate" : form.pain_level <= 8 ? " · Severe" : " · Debilitating"}
                </span>
              </label>
              <div className="slider-track-wrap">
                <span className="slider-min">1</span>
                <input type="range" min="1" max="10" value={form.pain_level}
                  onChange={e => update("pain_level", +e.target.value)}
                  className="menstrual-slider pain-slider"
                  style={{ "--pct": `${(form.pain_level - 1) / 9 * 100}%` }}
                />
                <span className="slider-max">10</span>
              </div>
            </div>
          </div>

          {/* ── Symptoms ─────────────────────────────────────────────── */}
          <div className="form-section">
            <div className="form-section-label">SYMPTOM PROFILE</div>
            <div className="symptom-grid">
              {SYMPTOM_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={`symptom-chip ${form.symptoms.includes(s.id) ? "selected" : ""}`}
                  onClick={() => toggleSymptom(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="menstrual-error">{error}</div>}

          <div className="form-actions">
            <button className="btn-analyse" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="btn-spinner" />Analysing…</>
                : <>▶ Run Cycle Analysis</>}
            </button>
            {result && (
              <button className="btn-reset" onClick={handleReset}>✕ Reset</button>
            )}
          </div>
        </div>

        {/* ══ RIGHT — RESULTS ════════════════════════════════════════════ */}
        <div className="menstrual-panel menstrual-result-panel" ref={resultRef}>
          <div className="panel-header">
            <span className="panel-icon">🩺</span>
            <div>
              <div className="panel-title">Cycle Intelligence</div>
              <div className="panel-sub">Neural-Core Menstrual Engine · XAI Enabled</div>
            </div>
          </div>

          {!result && !loading && (
            <div className="result-placeholder">
              <div className="placeholder-ring">
                <span>⬡</span>
              </div>
              <p>Awaiting cycle data for classification…</p>
              <p className="placeholder-sub">Fill in the form and run the analysis.</p>
            </div>
          )}

          {loading && (
            <div className="result-placeholder">
              <div className="loading-ring" />
              <p>Analysing cycle parameters…</p>
            </div>
          )}

          {result && meta && (
            <div className="result-content">

              {/* ── Diagnosis banner ─────────────────────────────────── */}
              <div className="diagnosis-banner" style={{ borderColor: meta.color }}>
                <div className="diagnosis-top">
                  <div className="diagnosis-label">CLASSIFICATION</div>
                  <div className="diagnosis-severity"
                    style={{ color: SEVERITY_COLOR[result.severity] }}>
                    <span className="sev-dot"
                      style={{ background: SEVERITY_COLOR[result.severity] }} />
                    {result.severity} Risk
                  </div>
                </div>
                <div className="diagnosis-name" style={{ color: meta.color }}>
                  {meta.icon} {meta.label}
                </div>
                <div className="diagnosis-desc">{result.description}</div>
              </div>

              {/* ── Triggered rules ──────────────────────────────────── */}
              {result.triggered_rules?.length > 0 && (
                <div className="rules-section">
                  <div className="section-label">DIAGNOSTIC CRITERIA MET</div>
                  <div className="rules-list">
                    {result.triggered_rules.map((rule, i) => (
                      <div key={i} className="rule-item">
                        <span className="rule-dot" />
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Cycle metrics row ─────────────────────────────────── */}
              <div className="metrics-row">
                <div className="metric-box">
                  <div className="metric-label">CYCLE LENGTH</div>
                  <div className="metric-val"
                    style={{ color: result.cycle_status_color }}>
                    {form.cycle_length} days
                  </div>
                  <div className="metric-sub">{result.cycle_status}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">FLOW SCORE</div>
                  <div className="metric-val"
                    style={{ color: result.flow_status_color }}>
                    {form.flow_heaviness}/5
                  </div>
                  <div className="metric-sub">{result.flow_status}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">PAIN INDEX</div>
                  <div className="metric-val"
                    style={{ color: result.pain_status_color }}>
                    {form.pain_level}/10
                  </div>
                  <div className="metric-sub">{result.pain_status}</div>
                </div>
              </div>

              {/* ── PCOS correlation ─────────────────────────────────── */}
              {result.pcos_correlation && (
                <div className="pcos-correlation">
                  <span className="corr-icon">⬡</span>
                  <span>{result.pcos_correlation}</span>
                </div>
              )}

              {/* ── Recommendations ──────────────────────────────────── */}
              <div className="recommendations">
                <div className="section-label">CLINICAL RECOMMENDATIONS</div>
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="rec-item">
                    <span className="rec-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* ── Disclaimer ───────────────────────────────────────── */}
              <div className="menstrual-disclaimer">
                ⚠ For academic & research use only. Not a substitute for clinical diagnosis.
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
