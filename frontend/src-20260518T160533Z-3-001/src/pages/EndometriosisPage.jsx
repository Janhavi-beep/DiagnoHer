import { useState, useRef } from "react"
import axios from "axios"
import "./EndometriosisPage.css"
import { saveModuleResult } from './CorrelationEngine';

const API = "http://localhost:5000"

const SYMPTOM_OPTIONS = [
  { id: "pelvic_pain",        label: "Chronic Pelvic Pain"       },
  { id: "dysmenorrhea",       label: "Painful Periods"           },
  { id: "dyspareunia",        label: "Pain During Intercourse"   },
  { id: "heavy_bleeding",     label: "Heavy Menstrual Bleeding"  },
  { id: "bowel_symptoms",     label: "Bowel / Bladder Issues"    },
  { id: "infertility",        label: "Difficulty Conceiving"     },
  { id: "fatigue",            label: "Chronic Fatigue"           },
  { id: "ovarian_cyst",       label: "Known Ovarian Cyst"        },
  { id: "family_history",     label: "Family History of Endo"    },
  { id: "back_pain",          label: "Lower Back Pain"           },
  { id: "bloating",           label: "Chronic Bloating"          },
  { id: "spotting",           label: "Inter-Menstrual Spotting"  },
]

const RISK_META = {
  Low:      { color: "#48bb78", icon: "◎", label: "Low Risk"      },
  Moderate: { color: "#ed8936", icon: "◈", label: "Moderate Risk" },
  High:     { color: "#fc8181", icon: "⊗", label: "High Risk"     },
}

export default function EndometriosisPage() {
  const [form, setForm] = useState({
    age:              "",
    pain_score:       1,
    cycle_length:     "",
    period_duration:  "",
    flow_heaviness:   3,
    symptoms:         [],
    ca125:            "",
    known_pcos:       false,
    prior_surgery:    false,
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const resultRef = useRef(null)

  const update      = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSymp  = (id)   => setForm(f => ({
    ...f,
    symptoms: f.symptoms.includes(id) ? f.symptoms.filter(s => s !== id) : [...f.symptoms, id]
  }))

  const handleSubmit = async () => {
    if (!form.age) { setError("Please enter your age."); return }
    setError(null); setLoading(true); setResult(null)
    try {
      const { data } = await axios.post(`${API}/predict/endometriosis`, form)
      setResult(data)
      try { saveModuleResult("endometriosis", data); } catch(e) {}
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (e) {
      setError(e.response?.data?.error || "Server error. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  const meta = result ? RISK_META[result.risk_level] || RISK_META.Low : null

  return (
    <div className="endo-page">

      <div className="endo-header">
        <div className="endo-header-icon">◈</div>
        <div>
          <h1 className="endo-title">Endometriosis <span>Risk Prediction</span></h1>
          <p className="endo-subtitle">XGBoost Classifier · Symptom-Based Differential · Clinical Risk Scoring</p>
        </div>
      </div>

      {/* Cross-module alert if navigated from PCOS/Menstrual */}
      <div className="crossmodule-banner">
        <span className="cm-icon">⬡</span>
        <span>Cross-module analysis: PCOS + menstrual irregularity findings are automatically factored into this prediction.</span>
      </div>

      <div className="endo-layout">

        {/* ══ INPUT ══════════════════════════════════════════════════════════ */}
        <div className="endo-panel endo-input">
          <div className="panel-hdr">
            <span>📋</span>
            <div>
              <div className="phdr-title">Clinical Input</div>
              <div className="phdr-sub">Symptom profile · Cycle data · Biomarkers</div>
            </div>
          </div>

          <div className="fsection">
            <div className="fsec-label">PATIENT PROFILE</div>
            <div className="frow-3">
              <div className="ffield">
                <label>Age <span className="req">*</span></label>
                <div className="iuwrap">
                  <input type="number" min="10" max="60" placeholder="28"
                    value={form.age} onChange={e => update("age", e.target.value)} />
                  <span className="unit">yrs</span>
                </div>
              </div>
              <div className="ffield">
                <label>Cycle Length</label>
                <div className="iuwrap">
                  <input type="number" min="15" max="90" placeholder="28"
                    value={form.cycle_length} onChange={e => update("cycle_length", e.target.value)} />
                  <span className="unit">days</span>
                </div>
              </div>
              <div className="ffield">
                <label>CA-125 Level</label>
                <div className="iuwrap">
                  <input type="number" min="0" max="1000" placeholder="optional"
                    value={form.ca125} onChange={e => update("ca125", e.target.value)} />
                  <span className="unit">U/mL</span>
                </div>
              </div>
            </div>
            <div className="frow-2 mt075">
              <div className="ffield">
                <label>Known PCOS</label>
                <div className="togwrap">
                  <button className={`togbtn ${form.known_pcos ? "on" : ""}`}
                    onClick={() => update("known_pcos", !form.known_pcos)}>
                    <span className="togknob" />
                  </button>
                  <span className="toglbl">{form.known_pcos ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="ffield">
                <label>Prior Pelvic Surgery</label>
                <div className="togwrap">
                  <button className={`togbtn ${form.prior_surgery ? "on" : ""}`}
                    onClick={() => update("prior_surgery", !form.prior_surgery)}>
                    <span className="togknob" />
                  </button>
                  <span className="toglbl">{form.prior_surgery ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fsection">
            <div className="fsec-label">CLINICAL SCORING</div>
            <div className="ffield">
              <label>
                Pelvic Pain Severity
                <span className="sval" style={{ color: `hsl(${120 - form.pain_score * 11}, 70%, 60%)` }}>
                  {form.pain_score}/10
                  {form.pain_score <= 2 ? " · None" : form.pain_score <= 4 ? " · Mild"
                    : form.pain_score <= 6 ? " · Moderate" : form.pain_score <= 8 ? " · Severe" : " · Debilitating"}
                </span>
              </label>
              <div className="slwrap">
                <span className="slmin">1</span>
                <input type="range" min="1" max="10" value={form.pain_score}
                  className="endo-slider"
                  style={{ "--pct": `${(form.pain_score - 1) / 9 * 100}%` }}
                  onChange={e => update("pain_score", +e.target.value)} />
                <span className="slmax">10</span>
              </div>
            </div>
            <div className="ffield mt075">
              <label>
                Flow Heaviness
                <span className="sval" style={{ color: `hsl(${120 - form.flow_heaviness * 20}, 70%, 60%)` }}>
                  {["", "Spotting", "Light", "Normal", "Heavy", "Very Heavy"][form.flow_heaviness]}
                </span>
              </label>
              <div className="slwrap">
                <span className="slmin">1</span>
                <input type="range" min="1" max="5" value={form.flow_heaviness}
                  className="endo-slider"
                  style={{ "--pct": `${(form.flow_heaviness - 1) / 4 * 100}%` }}
                  onChange={e => update("flow_heaviness", +e.target.value)} />
                <span className="slmax">5</span>
              </div>
            </div>
          </div>

          <div className="fsection">
            <div className="fsec-label">SYMPTOM PROFILE ({form.symptoms.length} selected)</div>
            <div className="symgrid">
              {SYMPTOM_OPTIONS.map(s => (
                <button key={s.id}
                  className={`symchip ${form.symptoms.includes(s.id) ? "sel" : ""}`}
                  onClick={() => toggleSymp(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="endo-error">{error}</div>}

          <div className="factns">
            <button className="btn-run" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="spinner" />Analysing…</> : <>◈ Predict Risk</>}
            </button>
            {result && <button className="btn-rst" onClick={() => { setResult(null);
 setError(null) }}>✕ Reset</button>}
          </div>
        </div>

        {/* ══ RESULTS ════════════════════════════════════════════════════════ */}
        <div className="endo-panel endo-result" ref={resultRef}>
          <div className="panel-hdr">
            <span>🩺</span>
            <div>
              <div className="phdr-title">Risk Assessment</div>
              <div className="phdr-sub">XGBoost · Endometriosis Prediction Engine</div>
            </div>
          </div>

          {!result && !loading && (
            <div className="placeholder">
              <div className="ph-ring"><span>◈</span></div>
              <p>Awaiting clinical data…</p>
              <p className="ph-sub">Complete the form to generate risk assessment.</p>
            </div>
          )}

          {loading && (
            <div className="placeholder">
              <div className="lring" /><p>Processing clinical parameters…</p>
            </div>
          )}

          {result && meta && (
            <div className="res-content">
              <div className="risk-banner" style={{ borderColor: meta.color }}>
                <div className="rb-top">
                  <span className="rb-label">RISK CLASSIFICATION</span>
                  <span className="rb-confidence" style={{ color: meta.color }}>
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="rb-level" style={{ color: meta.color }}>
                  {meta.icon} {meta.label}
                </div>
                <div className="rb-desc">{result.description}</div>
              </div>

              {/* Risk score bar */}
              <div className="riskbar-wrap">
                <div className="riskbar-label">
                  <span>Risk Score</span>
                  <span style={{ color: meta.color }}>{(result.risk_score * 100).toFixed(0)}%</span>
                </div>
                <div className="riskbar-track">
                  <div className="riskbar-fill"
                    style={{ width: `${result.risk_score * 100}%`, background: meta.color }} />
                </div>
              </div>

              {/* Key indicators */}
              {result.key_indicators?.length > 0 && (
                <div className="indicators">
                  <div className="sec-label">KEY RISK INDICATORS</div>
                  {result.key_indicators.map((ind, i) => (
                    <div key={i} className="ind-item">
                      <span className="ind-dot" style={{ background: meta.color }} />
                      {ind}
                    </div>
                  ))}
                </div>
              )}

              {/* Cross-module correlation */}
              {result.cross_module && (
                <div className="xmod-box">
                  <span className="xmod-icon">⬡</span>
                  <div>
                    <div className="xmod-title">Cross-Module Correlation</div>
                    <div className="xmod-body">{result.cross_module}</div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="recs">
                <div className="sec-label">CLINICAL RECOMMENDATIONS</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} className="rec-row">
                    <span className="rec-n">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              <div className="disclaimer">⚠ Research use only. Not a clinical diagnosis.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
