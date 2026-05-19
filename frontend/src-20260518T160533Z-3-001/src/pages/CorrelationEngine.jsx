/**
 * CorrelationEngine.jsx
 * Cross-module correlation panel.
 * Reads results from sessionStorage (set by each module page after detection).
 * Shows which conditions are clinically linked and generates a unified risk profile.
 *
 * Usage: Place <CorrelationPanel /> anywhere — it auto-reads available results.
 * Each module page should call: saveModuleResult("fibroid", result) after detection.
 */

import { useState, useEffect } from "react"
import "./CorrelationEngine.css"

// ── Each module saves its result here ──────────────────────────────────────────
export function saveModuleResult(module, result) {
  try {
    const existing = JSON.parse(sessionStorage.getItem("nc_results") || "{}")
    existing[module] = { result, timestamp: Date.now() }
    sessionStorage.setItem("nc_results", JSON.stringify(existing))
  } catch {}
}

export function getModuleResults() {
  try {
    return JSON.parse(sessionStorage.getItem("nc_results") || "{}")
  } catch { return {} }
}

// ── Clinical correlation rules (evidence-based) ─────────────────────────────
const CORRELATION_RULES = [
  {
    id: "pcos_endo",
    modules: ["pcos", "endometriosis"],
    condition: (r) =>
      r.pcos?.result?.pcos_analysis?.pcos_positive &&
      r.endometriosis?.result?.risk_level === "High",
    severity: "critical",
    title: "PCOS + Endometriosis Co-occurrence",
    body: "PCOS and endometriosis co-occur in ~30% of cases. This combination significantly increases infertility risk and requires multidisciplinary gynaecological management.",
    refs: ["Vercellini et al., 2014", "Sanchez et al., 2021"],
  },
  {
    id: "fibroid_menstrual",
    modules: ["fibroid", "menstrual"],
    condition: (r) =>
      r.fibroid?.result?.detection === "Fibroid Detected" &&
      r.menstrual?.result?.diagnosis,
    severity: "high",
    title: "Fibroid + Menstrual Irregularity",
    body: "Uterine fibroids — especially submucosal — are a leading cause of heavy menstrual bleeding (AUB). Menstrual irregularity findings strongly correlate with this fibroid detection.",
    refs: ["ACOG Practice Bulletin 96", "NICE NG88"],
  },
  {
    id: "pcos_menstrual",
    modules: ["pcos", "menstrual"],
    condition: (r) =>
      r.pcos?.result?.pcos_analysis?.pcos_positive &&
      r.menstrual?.result?.diagnosis,
    severity: "high",
    title: "PCOS-Linked Menstrual Irregularity",
    body: "Oligomenorrhea and amenorrhea are cardinal features of PCOS. These findings together satisfy the Rotterdam Criteria menstrual criterion.",
    refs: ["Rotterdam Criteria 2003", "ESHRE/ASRM 2018"],
  },
  {
    id: "endo_menstrual",
    modules: ["endometriosis", "menstrual"],
    condition: (r) =>
      r.endometriosis?.result?.risk_level !== "Low" &&
      r.menstrual?.result?.diagnosis,
    severity: "moderate",
    title: "Endometriosis Risk + Menstrual Pattern",
    body: "Dysmenorrhea and heavy menstrual bleeding are the most common presenting symptoms of endometriosis. Combined findings increase diagnostic confidence.",
    refs: ["Nnoaham et al., 2011", "Rogers et al., 2009"],
  },
  {
    id: "pcos_ovarian",
    modules: ["pcos", "ovarian"],
    condition: (r) =>
      r.pcos?.result?.pcos_analysis?.pcos_positive &&
      r.ovarian?.result?.ovarian_analysis?.type === "pcos",
    severity: "critical",
    title: "Dual PCOS Confirmation",
    body: "Both the PCOS ResNet classifier and the Ovarian Pathology module independently identified polycystic morphology. This dual-model confirmation strongly supports PCOS diagnosis.",
    refs: ["Rotterdam Criteria 2003"],
  },
  {
    id: "fibroid_endo",
    modules: ["fibroid", "endometriosis"],
    condition: (r) =>
      r.fibroid?.result?.detection === "Fibroid Detected" &&
      r.endometriosis?.result?.risk_level === "High",
    severity: "high",
    title: "Fibroid + High Endometriosis Risk",
    body: "Co-existing fibroids and endometriosis are found in 12-14% of patients. Both conditions independently impact fertility and often require combined surgical management.",
    refs: ["Bulletti et al., 2010"],
  },
]

// ── Composite health score ───────────────────────────────────────────────────
function computeCompositeScore(results) {
  let score = 100
  let findings = []

  if (results.pcos?.result?.pcos_analysis?.pcos_positive) {
    score -= 20; findings.push("PCOS positive")
  }
  if (results.fibroid?.result?.detection === "Fibroid Detected") {
    const fsi = results.fibroid.result.fsi_score || 0
    score -= Math.round(fsi * 0.25); findings.push(`Fibroid FSI ${fsi}`)
  }
  if (results.endometriosis?.result?.risk_level === "High") {
    score -= 20; findings.push("High endo risk")
  } else if (results.endometriosis?.result?.risk_level === "Moderate") {
    score -= 10
  }
  if (results.menstrual?.result?.diagnosis &&
      results.menstrual.result.diagnosis !== "Regular Cycle") {
    score -= 10; findings.push("Menstrual irregularity")
  }
  if (results.ovarian?.result?.ovarian_analysis?.type === "pcos" ||
      results.ovarian?.result?.ovarian_analysis?.type === "complex_cyst") {
    score -= 10; findings.push("Ovarian pathology")
  }

  return { score: Math.max(0, score), findings }
}

const SEV_META = {
  critical: { color: "#f56565", bg: "rgba(245,101,101,.1)",  border: "rgba(245,101,101,.3)", icon: "⊗" },
  high:     { color: "#fc8181", bg: "rgba(252,129,129,.08)", border: "rgba(252,129,129,.25)", icon: "◉" },
  moderate: { color: "#f6ad55", bg: "rgba(246,173,85,.08)",  border: "rgba(246,173,85,.2)",  icon: "◐" },
  low:      { color: "#68d391", bg: "rgba(104,211,145,.08)", border: "rgba(104,211,145,.2)", icon: "◎" },
}

const MODULE_ICONS = {
  pcos: "🧬", ovarian: "🔬", menstrual: "🩸",
  endometriosis: "◈", fibroid: "⬡",
}

export function CorrelationPanel() {
  const [results, setResults] = useState({})
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const load = () => setResults(getModuleResults())
    load()
    // Re-read when storage changes (other tab/module updates)
    window.addEventListener("storage", load)
    // Poll every 3s in case same-tab updates
    const iv = setInterval(load, 3000)
    return () => { window.removeEventListener("storage", load); clearInterval(iv) }
  }, [])

  const activeModules = Object.keys(results)
  if (activeModules.length === 0) return null

  const triggered = CORRELATION_RULES.filter(r => r.condition(results))
  const { score, findings } = computeCompositeScore(results)

  const scoreColor = score >= 80 ? "#68d391" : score >= 60 ? "#f6ad55" : score >= 40 ? "#fc8181" : "#f56565"
  const scoreLabel = score >= 80 ? "Good" : score >= 60 ? "Attention Needed" : score >= 40 ? "Concerning" : "Critical"

  return (
    <div className="corr-panel">
      <div className="corr-header">
        <div className="corr-title">
          <span>⬡</span>
          Cross-Module Correlation Analysis
        </div>
        <div className="corr-mod-badges">
          {activeModules.map(m => (
            <span key={m} className="corr-mod-badge">
              {MODULE_ICONS[m]} {m}
            </span>
          ))}
        </div>
      </div>

      {/* Composite score */}
      <div className="corr-score-row">
        <div className="corr-score-card" style={{ borderColor: scoreColor }}>
          <div className="corr-score-label">Reproductive Health Score</div>
          <div className="corr-score-val" style={{ color: scoreColor }}>{score}</div>
          <div className="corr-score-sub" style={{ color: scoreColor }}>{scoreLabel}</div>
          <div className="corr-score-bar-bg">
            <div className="corr-score-bar" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
        </div>
        <div className="corr-findings-list">
          <div className="corr-fl-title">Detected Findings</div>
          {findings.length === 0
            ? <div className="corr-fl-none">No significant findings</div>
            : findings.map((f,i) => (
                <div key={i} className="corr-fl-item">◆ {f}</div>
              ))
          }
        </div>
      </div>

      {/* Correlation cards */}
      {triggered.length > 0 && (
        <div className="corr-correlations">
          <div className="corr-section-title">Clinical Correlations Found</div>
          {triggered.map(rule => {
            const meta = SEV_META[rule.severity]
            return (
              <div key={rule.id}
                className={`corr-card ${expanded === rule.id ? "expanded" : ""}`}
                style={{ background: meta.bg, borderColor: meta.border }}
                onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
              >
                <div className="corr-card-top">
                  <span className="corr-card-icon" style={{ color: meta.color }}>{meta.icon}</span>
                  <div className="corr-card-title" style={{ color: meta.color }}>{rule.title}</div>
                  <div className="corr-card-mods">
                    {rule.modules.map(m => (
                      <span key={m} className="corr-mod-pill">{MODULE_ICONS[m]} {m}</span>
                    ))}
                  </div>
                  <span className="corr-card-chevron">{expanded === rule.id ? "▲" : "▼"}</span>
                </div>
                {expanded === rule.id && (
                  <div className="corr-card-body">
                    <p>{rule.body}</p>
                    <div className="corr-refs">
                      {rule.refs.map(r => <span key={r} className="corr-ref">📖 {r}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {triggered.length === 0 && (
        <div className="corr-no-corr">
          <span>◎</span>
          No significant cross-module correlations found between current results.
        </div>
      )}
    </div>
  )
}
