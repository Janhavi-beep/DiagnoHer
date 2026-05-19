import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getModuleResults } from "./CorrelationEngine"
import { CorrelationPanel } from "./CorrelationEngine"
import "./DashboardPage.css"

const ALL_MODULES = [
  { key: "pcos",          label: "PCOS Detection",       icon: "🧬", path: "/pcos",          color: "#b794f4" },
  { key: "ovarian",       label: "Ovarian Pathology",    icon: "🔬", path: "/ovarian",       color: "#63b3ed" },
  { key: "menstrual",     label: "Menstrual Analysis",   icon: "🩸", path: "/menstrual",     color: "#fc8181" },
  { key: "endometriosis", label: "Endometriosis Risk",   icon: "◈",  path: "/endometriosis", color: "#f6ad55" },
  { key: "fibroid",       label: "Fibroid Detection",    icon: "⬡",  path: "/fibroid",       color: "#68d391" },
]

function timeAgo(ts) {
  if (!ts) return ""
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins/60)}h ago`
}

function extractSummary(key, result) {
  if (!result) return { status: "—", risk: "unknown", detail: "" }
  switch (key) {
    case "pcos":
      return {
        status: result.pcos_analysis?.pcos_positive ? "PCOS Detected" : "No PCOS",
        risk:   result.pcos_analysis?.pcos_risk?.toLowerCase() || "low",
        detail: `${result.pcos_analysis?.follicle_count ?? 0} follicles · ${result.ovarian_analysis?.diagnosis || "—"}`,
      }
    case "ovarian":
      return {
        status: result.ovarian_analysis?.diagnosis || "Analysed",
        risk:   result.ovarian_analysis?.type === "pcos" || result.ovarian_analysis?.type === "complex_cyst" ? "high" : "low",
        detail: `Confidence ${((result.ovarian_analysis?.confidence||0)*100).toFixed(1)}%`,
      }
    case "menstrual":
      return {
        status: result.diagnosis || "Analysed",
        risk:   result.severity === "Severe" ? "high" : result.severity === "Moderate" ? "moderate" : "low",
        detail: result.severity || "",
      }
    case "endometriosis":
      return {
        status: `${result.risk_level || "—"} Risk`,
        risk:   (result.risk_level || "low").toLowerCase(),
        detail: `Score ${((result.risk_score||0)*100).toFixed(0)}% · ${result.model_used || ""}`,
      }
    case "fibroid":
      return {
        status: result.detection || "—",
        risk:   result.fsi_severity === "Critical" || result.fsi_severity === "Severe" ? "high"
              : result.fsi_severity === "Moderate" ? "moderate" : "low",
        detail: result.detection === "Fibroid Detected"
              ? `FSI ${result.fsi_score}/100 · ${result.size} · ${result.location}`
              : "No fibroid structures detected",
      }
    default: return { status: "—", risk: "unknown", detail: "" }
  }
}

const RISK_META = {
  high:     { color: "#fc8181", label: "High Risk",     dot: "●" },
  moderate: { color: "#f6ad55", label: "Moderate",      dot: "●" },
  low:      { color: "#68d391", label: "Low Risk",      dot: "●" },
  unknown:  { color: "#718096", label: "Unknown",        dot: "○" },
}

export default function DashboardPage() {
  const [results, setResults] = useState({})

  useEffect(() => {
    const load = () => setResults(getModuleResults())
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [])

  const ran    = ALL_MODULES.filter(m => results[m.key])
  const notRan = ALL_MODULES.filter(m => !results[m.key])

  const handleClear = () => {
    sessionStorage.removeItem("nc_results")
    setResults({})
  }

  return (
    <div className="dash-page">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Health <span>Dashboard</span></h1>
          <p className="dash-sub">Session summary · All modules · Cross-module correlation</p>
        </div>
        {ran.length > 0 && (
          <button className="dash-clear-btn" onClick={handleClear}>✕ Clear Session</button>
        )}
      </div>

      {/* Stats row */}
      <div className="dash-stats-row">
        {[
          { n: ran.length,    label: "Modules Run",        icon: "◉" },
          { n: notRan.length, label: "Modules Pending",    icon: "○" },
          { n: ran.filter(m => extractSummary(m.key, results[m.key]?.result).risk === "high").length,
            label: "High Risk Findings", icon: "⊗" },
          { n: ran.filter(m => extractSummary(m.key, results[m.key]?.result).risk === "low").length,
            label: "Low Risk Findings",  icon: "◎" },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <span className="dash-stat-icon">{s.icon}</span>
            <span className="dash-stat-n">{s.n}</span>
            <span className="dash-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {ran.length === 0 && (
        <div className="dash-empty">
          <div className="dash-empty-ring"><span>⬡</span></div>
          <h3>No modules run yet</h3>
          <p>Run any detection module to see your results here. Results are stored for the current session.</p>
          <div className="dash-module-links">
            {ALL_MODULES.map(m => (
              <Link key={m.key} to={m.path} className="dash-mod-link"
                style={{ "--mc": m.color }}>
                {m.icon} {m.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results grid */}
      {ran.length > 0 && (
        <>
          <div className="dash-section-title">Completed Modules</div>
          <div className="dash-results-grid">
            {ran.map(m => {
              const { status, risk, detail } = extractSummary(m.key, results[m.key]?.result)
              const riskMeta = RISK_META[risk] || RISK_META.unknown
              const ts = results[m.key]?.timestamp
              return (
                <div key={m.key} className="dash-result-card"
                  style={{ "--mc": m.color, borderColor: m.color + "40" }}>
                  <div className="dash-rc-top">
                    <span className="dash-rc-icon">{m.icon}</span>
                    <div className="dash-rc-info">
                      <div className="dash-rc-label">{m.label}</div>
                      <div className="dash-rc-time">{timeAgo(ts)}</div>
                    </div>
                    <span className="dash-rc-risk" style={{ color: riskMeta.color }}>
                      {riskMeta.dot} {riskMeta.label}
                    </span>
                  </div>
                  <div className="dash-rc-status" style={{ color: m.color }}>{status}</div>
                  <div className="dash-rc-detail">{detail}</div>
                  <Link to={m.path} className="dash-rc-rerun">Re-run →</Link>
                </div>
              )
            })}
          </div>

          {/* Correlation panel */}
          <CorrelationPanel />
        </>
      )}

      {/* Pending modules */}
      {notRan.length > 0 && ran.length > 0 && (
        <div className="dash-pending-section">
          <div className="dash-section-title">Modules Not Yet Run</div>
          <div className="dash-pending-grid">
            {notRan.map(m => (
              <Link key={m.key} to={m.path} className="dash-pending-card"
                style={{ "--mc": m.color }}>
                <span>{m.icon}</span>
                <span className="dash-pc-label">{m.label}</span>
                <span className="dash-pc-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
