/**
 * ReportGenerator.jsx
 * Generates a professional PDF-style report from any module's results.
 * Uses browser print API with a dedicated print stylesheet — no external PDF lib needed.
 * Import and use: <ReportButton result={result} module="fibroid" scanImage={preview} />
 */

import { useState } from "react"
import "./ReportGenerator.css"

const MODULE_META = {
  fibroid: {
    title: "Fibroid Detection & Characterization Report",
    color: "#68d391",
    icon: "⬡",
    code: "FBD",
  },
  pcos: {
    title: "PCOS Detection Report",
    color: "#b794f4",
    icon: "🧬",
    code: "PCS",
  },
  ovarian: {
    title: "Ovarian Pathology Report",
    color: "#63b3ed",
    icon: "🔬",
    code: "OVP",
  },
  menstrual: {
    title: "Menstrual Analysis Report",
    color: "#fc8181",
    icon: "🩸",
    code: "MEN",
  },
  endometriosis: {
    title: "Endometriosis Risk Assessment Report",
    color: "#f6ad55",
    icon: "◈",
    code: "END",
  },
}

function generateReportId(code) {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`
  const rand = Math.random().toString(36).substring(2,6).toUpperCase()
  return `NC-${code}-${stamp}-${rand}`
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function ReportButton({ result, module, scanImage, patientAge, patientGender }) {
  const [generating, setGenerating] = useState(false)
  const meta = MODULE_META[module] || MODULE_META.pcos

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      printReport(result, meta, scanImage, patientAge, patientGender)
      setGenerating(false)
    }, 300)
  }

  return (
    <button
      className="rpt-btn"
      onClick={handleGenerate}
      disabled={generating || !result}
      style={{ "--rpt-color": meta.color }}
    >
      {generating ? (
        <><span className="rpt-spin" /> Generating…</>
      ) : (
        <>{meta.icon} Download PDF Report</>
      )}
    </button>
  )
}

function printReport(result, meta, scanImage, patientAge, patientGender) {
  const reportId = generateReportId(meta.code)
  const dateStr  = formatDate()

  // Build findings rows dynamically based on module
  const findings = buildFindings(result, meta.code)

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Mono', monospace;
      background: #fff;
      color: #1a202c;
      padding: 40px 48px;
      font-size: 11px;
      line-height: 1.6;
    }

    /* Header */
    .rpt-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid ${meta.color};
      padding-bottom: 18px; margin-bottom: 24px;
    }
    .rpt-logo {
      font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
      color: #1a202c; letter-spacing: -0.5px;
    }
    .rpt-logo span { color: ${meta.color}; }
    .rpt-logo-sub { font-size: 9px; color: #718096; margin-top: 2px; }
    .rpt-id-block { text-align: right; }
    .rpt-id { font-size: 9px; color: #718096; }
    .rpt-id strong { color: #1a202c; font-size: 10px; }

    /* Module badge */
    .rpt-module-banner {
      background: ${meta.color}18;
      border: 1.5px solid ${meta.color}60;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex; align-items: center; gap: 12px;
    }
    .rpt-mod-icon { font-size: 24px; }
    .rpt-mod-title {
      font-family: 'Syne', sans-serif;
      font-size: 16px; font-weight: 700; color: #1a202c;
    }
    .rpt-mod-sub { font-size: 9px; color: #718096; margin-top: 2px; }

    /* Patient info */
    .rpt-patient-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 10px; margin-bottom: 20px;
    }
    .rpt-patient-cell {
      background: #f7fafc; border: 1px solid #e2e8f0;
      border-radius: 6px; padding: 8px 10px;
    }
    .rpt-cell-label { font-size: 8px; text-transform: uppercase; letter-spacing: .08em; color: #718096; }
    .rpt-cell-val   { font-size: 11px; font-weight: 600; color: #1a202c; margin-top: 2px; }

    /* Sections */
    .rpt-section { margin-bottom: 20px; }
    .rpt-sec-title {
      font-family: 'Syne', sans-serif;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .1em; color: ${meta.color};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px; margin-bottom: 10px;
    }

    /* Findings table */
    .rpt-table { width: 100%; border-collapse: collapse; }
    .rpt-table th {
      background: #f7fafc; font-size: 9px; text-transform: uppercase;
      letter-spacing: .08em; color: #718096; padding: 7px 10px;
      text-align: left; border: 1px solid #e2e8f0;
    }
    .rpt-table td {
      padding: 8px 10px; border: 1px solid #e2e8f0;
      font-size: 11px; vertical-align: middle;
    }
    .rpt-table tr:nth-child(even) td { background: #f7fafc; }
    .val-positive { color: #e53e3e; font-weight: 600; }
    .val-negative { color: #276749; font-weight: 600; }
    .val-warning  { color: #c05621; font-weight: 600; }
    .val-normal   { color: #2d3748; }

    /* FSI bar */
    .fsi-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: inline-block; vertical-align: middle; width: 100px; margin-right: 8px; }
    .fsi-bar-fill { height: 100%; border-radius: 4px; background: ${meta.color}; }

    /* Summary */
    .rpt-summary {
      background: #f7fafc; border-left: 3px solid ${meta.color};
      padding: 12px 14px; border-radius: 0 6px 6px 0;
      font-size: 11px; line-height: 1.7; color: #2d3748;
    }

    /* Recommendations */
    .rpt-rec { display: flex; gap: 10px; margin-bottom: 7px; }
    .rpt-rec-n { color: ${meta.color}; font-weight: 700; min-width: 20px; }

    /* Red flags */
    .rpt-flag {
      background: #fff5f5; border: 1px solid #fed7d7;
      border-radius: 6px; padding: 8px 12px;
      font-size: 11px; color: #c53030; margin-bottom: 6px;
    }
    .rpt-flag::before { content: "⚠ "; }

    /* Images */
    .rpt-img-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .rpt-img-item { text-align: center; }
    .rpt-img-label { font-size: 9px; color: #718096; margin-bottom: 4px; text-transform: uppercase; }
    .rpt-img-item img { width: 100%; border-radius: 6px; border: 1px solid #e2e8f0; }

    /* Scan image */
    .rpt-scan-img { max-width: 280px; border-radius: 8px; border: 1.5px solid #e2e8f0; }

    /* Urgency badge */
    .rpt-urgency {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 10px; font-weight: 700;
    }
    .urg-urgent  { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
    .urg-soon    { background: #fffaf0; color: #c05621; border: 1px solid #feebc8; }
    .urg-routine { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }

    /* Footer */
    .rpt-footer {
      border-top: 1px solid #e2e8f0; margin-top: 28px; padding-top: 14px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .rpt-disclaimer { font-size: 8.5px; color: #a0aec0; max-width: 500px; line-height: 1.5; }
    .rpt-page { font-size: 9px; color: #718096; }

    @media print {
      body { padding: 20px 28px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="rpt-header">
    <div>
      <div class="rpt-logo">Neural<span>Core</span> <small style="font-size:13px;font-weight:600">v4.0 PRO</small></div>
      <div class="rpt-logo-sub">AI-Powered Women's Health Diagnostics Platform</div>
    </div>
    <div class="rpt-id-block">
      <div class="rpt-id">Report ID: <strong>${reportId}</strong></div>
      <div class="rpt-id">Generated: <strong>${dateStr}</strong></div>
      <div class="rpt-id">Platform: <strong>NeuralCore v4.0 PRO</strong></div>
    </div>
  </div>

  <!-- Module banner -->
  <div class="rpt-module-banner">
    <div class="rpt-mod-icon">${meta.icon}</div>
    <div>
      <div class="rpt-mod-title">${meta.title}</div>
      <div class="rpt-mod-sub">AI-assisted analysis · Research use only · Not a clinical diagnosis</div>
    </div>
  </div>

  <!-- Patient info -->
  <div class="rpt-patient-grid">
    <div class="rpt-patient-cell">
      <div class="rpt-cell-label">Report ID</div>
      <div class="rpt-cell-val">${reportId}</div>
    </div>
    <div class="rpt-patient-cell">
      <div class="rpt-cell-label">Age</div>
      <div class="rpt-cell-val">${patientAge || "Not specified"}</div>
    </div>
    <div class="rpt-patient-cell">
      <div class="rpt-cell-label">Gender</div>
      <div class="rpt-cell-val">${patientGender || "Female"}</div>
    </div>
    <div class="rpt-patient-cell">
      <div class="rpt-cell-label">Module</div>
      <div class="rpt-cell-val">${meta.code}</div>
    </div>
  </div>

  <!-- Key Findings -->
  <div class="rpt-section">
    <div class="rpt-sec-title">Key Findings</div>
    <table class="rpt-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Finding</th>
          <th>Confidence</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${findings.rows}
      </tbody>
    </table>
  </div>

  ${findings.fsiBlock}

  <!-- Clinical Summary -->
  ${result?.clinical?.summary ? `
  <div class="rpt-section">
    <div class="rpt-sec-title">Clinical Summary</div>
    <div class="rpt-summary">${result.clinical.summary}</div>
  </div>` : ""}

  <!-- Red Flags -->
  ${result?.clinical?.red_flags?.length > 0 ? `
  <div class="rpt-section">
    <div class="rpt-sec-title">⚠ Red Flags</div>
    ${result.clinical.red_flags.map(rf => `<div class="rpt-flag">${rf}</div>`).join("")}
  </div>` : ""}

  <!-- Recommendations -->
  ${result?.clinical?.recommendations?.length > 0 ? `
  <div class="rpt-section">
    <div class="rpt-sec-title">Management Recommendations</div>
    ${result.clinical.recommendations.map((r,i) => `
      <div class="rpt-rec">
        <span class="rpt-rec-n">${String(i+1).padStart(2,"0")}</span>
        <span>${r}</span>
      </div>`).join("")}
  </div>` : ""}

  <!-- Images -->
  ${scanImage || result?.gradcam_image ? `
  <div class="rpt-section">
    <div class="rpt-sec-title">Imaging</div>
    <div class="rpt-img-grid">
      ${scanImage ? `<div class="rpt-img-item"><div class="rpt-img-label">Original Scan</div><img src="${scanImage}" /></div>` : ""}
      ${result?.annotated_image ? `<div class="rpt-img-item"><div class="rpt-img-label">YOLO Detection</div><img src="data:image/jpeg;base64,${result.annotated_image}" /></div>` : ""}
      ${result?.gradcam_image ? `<div class="rpt-img-item"><div class="rpt-img-label">GradCAM++ Explainability</div><img src="data:image/jpeg;base64,${result.gradcam_image}" /></div>` : ""}
    </div>
  </div>` : ""}

  <!-- Footer -->
  <div class="rpt-footer">
    <div class="rpt-disclaimer">
      ⚠ FOR ACADEMIC AND RESEARCH USE ONLY. This report is generated by an AI system
      and is NOT a substitute for professional clinical diagnosis. Always consult a qualified
      healthcare professional. References: FIGO 2011, ACOG, NICE NG88, Rotterdam Criteria v2.0.
    </div>
    <div class="rpt-page">NeuralCore v4.0 PRO · Page 1 of 1</div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open("", "_blank", "width=900,height=700")
  win.document.write(html)
  win.document.close()
}

function buildFindings(result, code) {
  if (!result) return { rows: "", fsiBlock: "" }

  let rows = ""
  let fsiBlock = ""

  const statusClass = (val) => {
    const v = String(val).toLowerCase()
    if (v.includes("detected") || v.includes("high") || v.includes("positive")) return "val-positive"
    if (v.includes("no ") || v.includes("normal") || v.includes("low")) return "val-negative"
    if (v.includes("moderate") || v.includes("mild")) return "val-warning"
    return "val-normal"
  }

  const row = (param, finding, conf, status) => `
    <tr>
      <td><strong>${param}</strong></td>
      <td class="${statusClass(finding)}">${finding}</td>
      <td>${conf ? `${(conf*100).toFixed(1)}%` : "—"}</td>
      <td>${status}</td>
    </tr>`

  if (code === "FBD") {
    rows += row("Detection", result.detection, result.detection_conf,
      result.detection === "Fibroid Detected" ? "⚠ Positive" : "✓ Clear")
    rows += row("Fibroid Count", result.num_fibroids ?? "0", null, "Detected by YOLO")
    rows += row("Size Classification", result.size || "—", result.size_conf, getSizeStatus(result.size))
    rows += row("Location", result.location || "—", result.location_conf, getLocStatus(result.location))
    rows += row("Texture", result.texture || "—", result.texture_conf, "Assessed")
    rows += row("MC Dropout Uncertainty", `σ = ${result.uncertainty}`, null,
      result.uncertainty > 0.15 ? "⚠ High" : "✓ Low")
    if (result.fsi_score !== undefined) {
      const urg = result.clinical?.urgency || "Routine"
      const urgClass = urg === "Urgent" ? "urg-urgent" : urg.includes("Soon") ? "urg-soon" : "urg-routine"
      fsiBlock = `
        <div class="rpt-section">
          <div class="rpt-sec-title">Fibroid Severity Index (FSI)</div>
          <table class="rpt-table">
            <tr>
              <td><strong>FSI Score</strong></td>
              <td>
                <div class="fsi-bar-bg"><div class="fsi-bar-fill" style="width:${result.fsi_score}%"></div></div>
                <strong>${result.fsi_score} / 100</strong>
              </td>
              <td><strong>Severity</strong></td>
              <td class="${statusClass(result.fsi_severity)}">${result.fsi_severity}</td>
            </tr>
            <tr>
              <td><strong>Clinical Urgency</strong></td>
              <td colspan="3"><span class="rpt-urgency ${urgClass}">${urg}</span></td>
            </tr>
          </table>
        </div>`
    }
  } else if (code === "PCS") {
    rows += row("PCOS Status", result.pcos_analysis?.status || "—",
      result.pcos_analysis?.pcos_probability, result.pcos_analysis?.pcos_positive ? "⚠ Positive" : "✓ Negative")
    rows += row("Follicle Count", result.pcos_analysis?.follicle_count ?? "—", null, getFollicleStatus(result.pcos_analysis?.follicle_count))
    rows += row("Risk Level", result.pcos_analysis?.pcos_risk || "—", null, "Composite")
    rows += row("Ovarian Diagnosis", result.ovarian_analysis?.diagnosis || "—", result.ovarian_analysis?.confidence, "ResNet50")
  } else if (code === "END") {
    rows += row("Risk Level", result.risk_level || "—", result.confidence, getRiskStatus(result.risk_level))
    rows += row("Risk Score", result.risk_score !== undefined ? `${(result.risk_score*100).toFixed(1)}%` : "—", null, "XGBoost")
    rows += row("Model Used", result.model_used || "—", null, "Inference")
    if (result.key_indicators?.length > 0) {
      rows += row("Key Indicators", result.key_indicators.slice(0,2).join("; "), null, "Detected")
    }
  } else if (code === "MEN") {
    rows += row("Diagnosis", result.diagnosis || "—", result.confidence, "Rule Engine")
    rows += row("Severity", result.severity || "—", null, "Clinical")
    rows += row("Cycle Length", result.cycle_data?.cycle_length ? `${result.cycle_data.cycle_length} days` : "—", null, "Input")
  }

  return { rows, fsiBlock }
}

const getSizeStatus = s => ({ small:"Monitoring",medium:"Clinical Review",large:"Intervention Consider" }[s] || "—")
const getLocStatus  = l => ({ submucosal:"⚠ High Impact",intramural:"Moderate Impact",subserosal:"Lower Impact" }[l] || "—")
const getRiskStatus = r => ({ High:"⚠ High Risk",Moderate:"Moderate Risk",Low:"✓ Low Risk" }[r] || "—")
const getFollicleStatus = n => !n ? "—" : n >= 12 ? "⚠ Polycystic" : n >= 8 ? "Borderline" : "✓ Normal"
