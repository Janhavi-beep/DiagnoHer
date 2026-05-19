import { useState } from "react"
import { Link } from "react-router-dom"
import "./SymptomQuizPage.css"

const QUESTIONS = [
  {
    id: "periods",
    text: "How would you describe your menstrual cycle?",
    options: [
      { label: "Regular (every 21–35 days)", value: "regular" },
      { label: "Irregular or unpredictable", value: "irregular" },
      { label: "Very infrequent (>35 days apart)", value: "infrequent" },
      { label: "Absent for 3+ months", value: "absent" },
    ],
  },
  {
    id: "flow",
    text: "How is your menstrual flow?",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Very heavy (soaking pads/tampons hourly)", value: "heavy" },
      { label: "Very light or spotting only", value: "light" },
      { label: "N/A — no periods", value: "na" },
    ],
  },
  {
    id: "pain",
    text: "Do you experience pelvic pain?",
    options: [
      { label: "No pain", value: "none" },
      { label: "Mild cramping during periods", value: "mild" },
      { label: "Severe pain during periods (dysmenorrhea)", value: "severe" },
      { label: "Chronic pelvic pain (not just during periods)", value: "chronic" },
    ],
  },
  {
    id: "hair_acne",
    text: "Do you experience any of the following?",
    options: [
      { label: "Neither", value: "none" },
      { label: "Excess facial/body hair (hirsutism)", value: "hair" },
      { label: "Persistent acne or oily skin", value: "acne" },
      { label: "Both excess hair and acne", value: "both" },
    ],
  },
  {
    id: "weight",
    text: "Have you noticed unexpected weight changes?",
    options: [
      { label: "No changes", value: "none" },
      { label: "Unexplained weight gain", value: "gain" },
      { label: "Difficulty losing weight despite effort", value: "difficulty" },
      { label: "Unexplained weight loss", value: "loss" },
    ],
  },
  {
    id: "bloating",
    text: "Do you experience bloating or pelvic pressure?",
    options: [
      { label: "No", value: "none" },
      { label: "Occasional mild bloating", value: "mild" },
      { label: "Persistent bloating or fullness", value: "persistent" },
      { label: "Visible abdominal swelling", value: "visible" },
    ],
  },
  {
    id: "fertility",
    text: "Have you had difficulty conceiving (if applicable)?",
    options: [
      { label: "Not trying / Not applicable", value: "na" },
      { label: "No difficulty", value: "none" },
      { label: "Trying for 6–12 months without success", value: "moderate" },
      { label: "Trying for 12+ months without success", value: "severe" },
    ],
  },
  {
    id: "intercourse",
    text: "Do you experience pain during intercourse (dyspareunia)?",
    options: [
      { label: "No", value: "none" },
      { label: "Occasionally", value: "occasional" },
      { label: "Frequently", value: "frequent" },
      { label: "Almost always / severe", value: "severe" },
    ],
  },
  {
    id: "ultrasound",
    text: "Have you had a pelvic ultrasound before?",
    options: [
      { label: "No — never had one", value: "never" },
      { label: "Yes — results were normal", value: "normal" },
      { label: "Yes — abnormality found (cysts, fibroids, etc.)", value: "abnormal" },
      { label: "Yes — inconclusive results", value: "inconclusive" },
    ],
  },
  {
    id: "family",
    text: "Family history of reproductive conditions?",
    options: [
      { label: "None known", value: "none" },
      { label: "PCOS in family", value: "pcos" },
      { label: "Endometriosis in family", value: "endo" },
      { label: "Fibroids / uterine conditions in family", value: "fibroid" },
    ],
  },
]

// ── Scoring logic ────────────────────────────────────────────────────────────
function computeRecommendations(answers) {
  const scores = { pcos: 0, fibroid: 0, endometriosis: 0, menstrual: 0, ovarian: 0 }

  // periods
  if (answers.periods === "irregular" || answers.periods === "infrequent") { scores.pcos += 3; scores.menstrual += 3 }
  if (answers.periods === "absent") { scores.pcos += 4; scores.menstrual += 4 }

  // flow
  if (answers.flow === "heavy") { scores.fibroid += 4; scores.menstrual += 3; scores.endometriosis += 2 }
  if (answers.flow === "light")  { scores.menstrual += 2 }

  // pain
  if (answers.pain === "severe")  { scores.endometriosis += 4; scores.menstrual += 3 }
  if (answers.pain === "chronic") { scores.endometriosis += 5; scores.fibroid += 3 }
  if (answers.pain === "mild")    { scores.menstrual += 2 }

  // hair/acne
  if (answers.hair_acne === "hair" || answers.hair_acne === "both") { scores.pcos += 4 }
  if (answers.hair_acne === "acne") { scores.pcos += 2 }

  // weight
  if (answers.weight === "gain" || answers.weight === "difficulty") { scores.pcos += 3 }

  // bloating
  if (answers.bloating === "persistent") { scores.fibroid += 2; scores.ovarian += 2 }
  if (answers.bloating === "visible")    { scores.fibroid += 4; scores.ovarian += 4 }

  // fertility
  if (answers.fertility === "moderate") { scores.pcos += 2; scores.endometriosis += 2; scores.fibroid += 1 }
  if (answers.fertility === "severe")   { scores.pcos += 3; scores.endometriosis += 4; scores.fibroid += 3 }

  // intercourse
  if (answers.intercourse === "frequent") { scores.endometriosis += 3; scores.fibroid += 2 }
  if (answers.intercourse === "severe")   { scores.endometriosis += 5 }

  // ultrasound
  if (answers.ultrasound === "abnormal") {
    scores.pcos += 2; scores.fibroid += 2; scores.ovarian += 3
  }

  // family
  if (answers.family === "pcos")    { scores.pcos += 3 }
  if (answers.family === "endo")    { scores.endometriosis += 3 }
  if (answers.family === "fibroid") { scores.fibroid += 3 }

  // Sort by score
  const sorted = Object.entries(scores)
    .sort((a,b) => b[1] - a[1])
    .filter(([,v]) => v > 0)

  return sorted
}

const MODULE_META = {
  pcos:          { label: "PCOS Detection",     icon: "🧬", color: "#b794f4", path: "/pcos",          desc: "Polycystic ovary syndrome — hormonal & follicle analysis" },
  fibroid:       { label: "Fibroid Detection",  icon: "⬡",  color: "#68d391", path: "/fibroid",       desc: "Uterine fibroids — size, location & severity scoring" },
  endometriosis: { label: "Endometriosis Risk", icon: "◈",  color: "#f6ad55", path: "/endometriosis", desc: "Endometriosis risk assessment from symptom profile" },
  menstrual:     { label: "Menstrual Analysis", icon: "🩸", color: "#fc8181", path: "/menstrual",     desc: "Cycle irregularity — 6-class rule-based analysis" },
  ovarian:       { label: "Ovarian Pathology",  icon: "🔬", color: "#63b3ed", path: "/ovarian",       desc: "Ovarian cysts & pathology — 5-class differential" },
}

export default function SymptomQuizPage() {
  const [step, setStep] = useState(0)       // 0 = intro, 1-10 = questions, 11 = results
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)

  const totalQ = QUESTIONS.length
  const isIntro   = step === 0
  const isResults = step > totalQ
  const current   = isIntro || isResults ? null : QUESTIONS[step - 1]
  const progress  = isResults ? 100 : ((step) / totalQ) * 100

  const handleAnswer = (val) => {
    setSelected(val)
    setTimeout(() => {
      setAnswers(prev => ({ ...prev, [current.id]: val }))
      setSelected(null)
      setStep(s => s + 1)
    }, 350)
  }

  const recommendations = isResults ? computeRecommendations(answers) : []
  const maxScore = recommendations[0]?.[1] || 1

  return (
    <div className="quiz-page">

      {/* Progress bar */}
      {!isIntro && (
        <div className="quiz-progress-bar">
          <div className="quiz-pb-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Intro */}
      {isIntro && (
        <div className="quiz-intro">
          <div className="quiz-icon-ring"><span>◈</span></div>
          <h1 className="quiz-intro-title">
            Symptom <span>Self-Assessment</span>
          </h1>
          <p className="quiz-intro-desc">
            Answer 10 quick questions about your symptoms.
            Our algorithm will recommend which AI detection modules
            are most relevant to your profile.
          </p>
          <div className="quiz-intro-meta">
            <span>◉ 10 questions</span>
            <span>◉ ~2 minutes</span>
            <span>◉ Completely anonymous</span>
          </div>
          <div className="quiz-intro-disclaimer">
            This is not a clinical diagnosis. Results suggest which modules to explore.
          </div>
          <button className="quiz-start-btn" onClick={() => setStep(1)}>
            Begin Assessment →
          </button>
        </div>
      )}

      {/* Question */}
      {!isIntro && !isResults && current && (
        <div className="quiz-question-wrap">
          <div className="quiz-q-counter">
            Question {step} of {totalQ}
          </div>
          <h2 className="quiz-q-text">{current.text}</h2>
          <div className="quiz-options">
            {current.options.map(opt => (
              <button
                key={opt.value}
                className={`quiz-option ${selected === opt.value ? "selected" : ""}`}
                onClick={() => handleAnswer(opt.value)}
              >
                <span className="quiz-opt-dot">○</span>
                {opt.label}
              </button>
            ))}
          </div>
          <button className="quiz-back-btn"
            onClick={() => setStep(s => Math.max(0, s-1))}
            disabled={step <= 1}>
            ← Back
          </button>
        </div>
      )}

      {/* Results */}
      {isResults && (
        <div className="quiz-results">
          <div className="quiz-res-header">
            <div className="quiz-res-icon">◉</div>
            <h2 className="quiz-res-title">Your <span>Recommendations</span></h2>
            <p className="quiz-res-sub">
              Based on your symptom profile, these modules are most relevant.
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="quiz-no-rec">
              No significant indicators found. Consider routine health screening.
            </div>
          ) : (
            <div className="quiz-rec-list">
              {recommendations.map(([mod, score], i) => {
                const meta = MODULE_META[mod]
                const pct  = Math.round((score / maxScore) * 100)
                const isTop = i === 0
                return (
                  <div key={mod}
                    className={`quiz-rec-card ${isTop ? "top-rec" : ""}`}
                    style={{ "--rc": meta.color }}>
                    {isTop && <div className="quiz-rec-badge">⬆ Top Recommendation</div>}
                    <div className="quiz-rec-top">
                      <span className="quiz-rec-icon">{meta.icon}</span>
                      <div className="quiz-rec-info">
                        <div className="quiz-rec-name" style={{ color: meta.color }}>{meta.label}</div>
                        <div className="quiz-rec-desc">{meta.desc}</div>
                      </div>
                      <Link to={meta.path} className="quiz-rec-btn"
                        style={{ borderColor: meta.color, color: meta.color }}>
                        Launch →
                      </Link>
                    </div>
                    <div className="quiz-rec-bar-wrap">
                      <span className="quiz-rec-bar-label">Relevance</span>
                      <div className="quiz-rec-bar-bg">
                        <div className="quiz-rec-bar-fill"
                          style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                      <span className="quiz-rec-pct" style={{ color: meta.color }}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="quiz-res-actions">
            <button className="quiz-restart-btn" onClick={() => { setStep(0); setAnswers({}) }}>
              ↺ Retake Quiz
            </button>
            <Link to="/" className="quiz-home-btn">← Back to Home</Link>
          </div>

          <div className="quiz-res-disclaimer">
            ⚠ This symptom assessment is not a medical diagnosis. Results indicate which
            AI modules may be relevant to your profile. Always consult a qualified
            healthcare professional for clinical evaluation.
          </div>
        </div>
      )}
    </div>
  )
}
