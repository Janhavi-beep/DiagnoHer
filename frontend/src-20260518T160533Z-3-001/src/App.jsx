import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PCOSPage          from './pages/PCOSPage';
import OvarianPage       from './pages/OvarianPage';
import MenstrualPage     from './pages/MenstrualPage';
import EndometriosisPage from './pages/EndometriosisPage';
import FibroidPage       from './pages/FibroidPage';
import DashboardPage     from './pages/DashboardPage';
import ModelStatsPage    from './pages/ModelStatsPage';
import SymptomQuizPage   from './pages/SymptomQuizPage';
import SymptomCheckerPage from './pages/SymptomCheckerPage';
import ExerciseHubPage   from './pages/ExerciseHubPage';
import DietHubPage       from './pages/DietHubPage';
import AssistantPage     from './pages/AssistantPage';
import './App.css';

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
const Navbar = ({ theme, toggleTheme }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem', flexShrink:0 }}>
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">Diagno<span className="brand-accent">Her</span></span>
          <span className="brand-version">v4.0 PRO</span>
        </Link>
        {/* Theme toggle — sits under the brand */}
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ alignSelf:'flex-start', padding:'0.2rem 0.6rem', fontSize:'0.68rem' }}>
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div className="navbar-links">
        {/* AI Detection Modules */}
        <Link to="/fibroid"       className={`nav-link ${isActive('/fibroid')       ? 'active' : ''}`}><span className="nav-dot">⬡</span> Fibroid</Link>
        <Link to="/pcos"          className={`nav-link ${isActive('/pcos')          ? 'active' : ''}`}><span className="nav-dot">🧬</span> PCOS</Link>
        <Link to="/ovarian"       className={`nav-link ${isActive('/ovarian')       ? 'active' : ''}`}><span className="nav-dot">🔬</span> Ovarian</Link>
        <Link to="/menstrual"     className={`nav-link ${isActive('/menstrual')     ? 'active' : ''}`}><span className="nav-dot">🩸</span> Menstrual</Link>
        <Link to="/endometriosis" className={`nav-link ${isActive('/endometriosis') ? 'active' : ''}`}><span className="nav-dot">◈</span> Endo</Link>

        <div className="nav-divider" />

        {/* Platform features */}
        <Link to="/symptom-checker" className={`nav-link nav-link-alt ${isActive('/symptom-checker') ? 'active' : ''}`}>🔍 Symptoms</Link>
        <Link to="/exercise"        className={`nav-link nav-link-alt ${isActive('/exercise')        ? 'active' : ''}`}>🏃 Exercise</Link>
        <Link to="/diet"            className={`nav-link nav-link-alt ${isActive('/diet')            ? 'active' : ''}`}>🥗 Diet</Link>
        <Link to="/assistant"       className={`nav-link nav-link-alt ${isActive('/assistant')       ? 'active' : ''}`}>🤖 AI Chat</Link>

        <div className="nav-divider" />

        <Link to="/quiz"        className={`nav-link nav-link-alt ${isActive('/quiz')        ? 'active' : ''}`}>◈ Quiz</Link>
        <Link to="/dashboard"   className={`nav-link nav-link-alt ${isActive('/dashboard')   ? 'active' : ''}`}>◉ Dashboard</Link>
        <Link to="/model-stats" className={`nav-link nav-link-alt ${isActive('/model-stats') ? 'active' : ''}`}>⬡ Stats</Link>
      </div>
    </nav>
  );
};

// ─── FOOTER ──────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="footer">
    <div className="footer-grid">
      <div className="footer-col">
        <span className="footer-logo">⬡ DiagnoHer</span>
        <p className="footer-tagline">AI-powered clinical diagnostics<br />for precision women's health.</p>
      </div>
      <div className="footer-col">
        <h4>Detection Modules</h4>
        <Link to="/fibroid">Fibroid Detection</Link>
        <Link to="/pcos">PCOS Detection</Link>
        <Link to="/ovarian">Ovarian Pathology</Link>
        <Link to="/menstrual">Menstrual Analysis</Link>
        <Link to="/endometriosis">Endometriosis Risk</Link>
      </div>
      <div className="footer-col">
        <h4>Health Tools</h4>
        <Link to="/symptom-checker">Symptom Checker</Link>
        <Link to="/exercise">Exercise Hub</Link>
        <Link to="/diet">Diet & Nutrition</Link>
        <Link to="/assistant">AI Health Assistant</Link>
      </div>
      <div className="footer-col">
        <h4>Platform</h4>
        <Link to="/quiz">Symptom Self-Assessment</Link>
        <Link to="/dashboard">Health Dashboard</Link>
        <Link to="/model-stats">Model Performance</Link>
      </div>
      <div className="footer-col">
        <h4>Tech Stack</h4>
        <span>React · Python · PyTorch</span>
        <span>ResNet50 · YOLOv8 · XGBoost</span>
        <span>ConvAutoencoder · GradCAM++</span>
        <span>MC Dropout · FSI · Flask</span>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2025 DiagnoHer — For academic &amp; research use only.</span>
    </div>
  </footer>
);

// ─── GRID BACKGROUND ─────────────────────────────────────────────────────────
const GridBackground = () => (
  <div className="grid-bg" aria-hidden="true">
    <div className="grid-lines" />
    <div className="glow glow-1" />
    <div className="glow glow-2" />
    <div className="glow glow-3" />
  </div>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const LandingPage = () => {
  const cardsRef = useRef([]);

  useEffect(() => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      setTimeout(() => card.classList.add('revealed'), 200 + i * 120);
    });
  }, []);

  const MODULES = [
    {
      to: "/fibroid", cls: "fibroid-card", icon: "⬡", badge: "YOLOv8 · ResNet50 · FSI",
      title: "Fibroid Detection",
      desc: "Uterine fibroid detection and characterization — size, location, texture, severity scoring and growth simulation.",
      features: ["YOLO bounding box detection", "GradCAM++ explainability", "FSI severity 0–100"],
      btn: "Detect Fibroid →",
    },
    {
      to: "/pcos", cls: "pcos-card", icon: "🧬", badge: "Rotterdam Criteria",
      title: "PCOS Detection",
      desc: "Follicle quantification, hormonal marker analysis, and Rotterdam criteria–based differential scoring.",
      features: ["Follicle count & morphology", "XAI neural mapping", "Clinical risk scoring"],
      btn: "Launch System →",
    },
    {
      to: "/ovarian", cls: "ovarian-card", icon: "🔬", badge: "5-Class Differential",
      title: "Ovarian Pathology",
      desc: "Deep tissue classification across 5 pathological categories using ResNet-based feature extraction.",
      features: ["Multi-class tissue diagnosis", "Confidence heatmaps", "Pathology grading"],
      btn: "Launch Lab →",
    },
    {
      to: "/menstrual", cls: "menstrual-card", icon: "🩸", badge: "6-Class Rule Engine",
      title: "Menstrual Analysis",
      desc: "Cycle irregularity classification across 6 clinical categories using explainable rule-based XAI engine.",
      features: ["Oligomenorrhea · Amenorrhea", "Menorrhagia · Dysmenorrhea", "PCOS-linked irregularity"],
      btn: "Launch Engine →",
    },
    {
      to: "/endometriosis", cls: "endo-card", icon: "◈", badge: "XGBoost Classifier",
      title: "Endometriosis Risk",
      desc: "Symptom-based risk prediction for endometriosis using trained XGBoost with cross-module correlation.",
      features: ["Symptom differential scoring", "CA-125 biomarker integration", "PCOS co-occurrence detection"],
      btn: "Assess Risk →",
    },
  ];

  const PLATFORM = [
    {
      to: "/symptom-checker", icon: "🔍", color: "#22d3ee",
      title: "Symptom Checker",
      desc: "Select your symptoms and get an AI risk profile across 6 conditions with personalised recommendations.",
      btn: "Check Symptoms →",
    },
    {
      to: "/exercise", icon: "🏃", color: "#34d399",
      title: "Exercise Hub",
      desc: "Condition-specific exercise library plus live YouTube workout search filtered by your condition.",
      btn: "Browse Exercises →",
    },
    {
      to: "/diet", icon: "🥗", color: "#fbbf24",
      title: "Diet & Nutrition",
      desc: "Evidence-based meal plans, foods to eat/avoid, and supplement guides for each condition.",
      btn: "View Nutrition Plans →",
    },
    {
      to: "/assistant", icon: "🤖", color: "#a78bfa",
      title: "AI Health Assistant",
      desc: "Claude-powered chat for interpreting results, explaining conditions, and answering health questions.",
      btn: "Ask AI Assistant →",
    },
    {
      to: "/quiz", icon: "◈", color: "#68d391",
      title: "Symptom Quiz",
      desc: "10-question self-assessment that recommends which modules fit your symptom profile.",
      btn: "Start Quiz →",
    },
    {
      to: "/dashboard", icon: "◉", color: "#63b3ed",
      title: "Health Dashboard",
      desc: "Session summary with cross-module correlations and composite reproductive health score.",
      btn: "View Dashboard →",
    },
  ];

  return (
    <div className="landing-container">
      <GridBackground />

      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">Intelligent Diagnostic System · Women's Reproductive Health</div>
        <h1 className="main-title">
          Diagno<span className="title-accent">Her</span>
          <span className="v-tag">v4.0 PRO</span>
        </h1>
        <p className="subtitle">
          An Integrated Clinical Decision Support Platform for Women's Reproductive Health.<br />
          Fibroid · PCOS · Ovarian · Endometriosis · Menstrual · Deep Learning · Explainable AI.
        </p>
        <div className="hero-stats">
          <div className="stat"><span className="stat-num">5</span><span className="stat-label">AI Modules</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">7</span><span className="stat-label">ML Models</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">0.97</span><span className="stat-label">Avg AUC</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-num">XAI</span><span className="stat-label">Explainable</span></div>
        </div>
        <div className="hero-quick-access">
          <Link to="/symptom-checker" className="hero-qa-btn">🔍 Symptom Checker</Link>
          <Link to="/quiz"            className="hero-qa-btn qa-quiz">◈ Quick Quiz</Link>
          <Link to="/dashboard"       className="hero-qa-btn qa-dash">◉ My Dashboard</Link>
          <Link to="/model-stats"     className="hero-qa-btn qa-stats">⬡ Model Stats</Link>
          <Link to="/assistant"       className="hero-qa-btn">🤖 AI Assistant</Link>
        </div>
      </div>

      {/* AI DETECTION MODULES */}
      <div className="section-label">AI Detection Modules</div>
      <div className="selection-grid selection-grid-5">
        {MODULES.map((m, i) => (
          <Link
            key={m.to}
            to={m.to}
            className={`selection-card ${m.cls}`}
            ref={el => cardsRef.current[i] = el}
          >
            <div className="card-glow" />
            <div className="card-header">
              <div className="card-icon">{m.icon}</div>
              <div className="card-badge">{m.badge}</div>
            </div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
            <ul className="card-features">
              {m.features.map((f, j) => <li key={j}>✦ {f}</li>)}
            </ul>
            <button className="select-btn">{m.btn}</button>
          </Link>
        ))}
      </div>

      {/* PLATFORM FEATURES */}
      <div className="section-label" style={{ marginTop: "3rem" }}>Platform Features</div>
      <div className="platform-features-grid platform-features-grid-6">
        {PLATFORM.map(f => (
          <Link key={f.to} to={f.to} className="pf-card" style={{ "--pfc": f.color }}>
            <div className="pf-icon">{f.icon}</div>
            <div className="pf-title">{f.title}</div>
            <div className="pf-desc">{f.desc}</div>
            <div className="pf-btn">{f.btn}</div>
          </Link>
        ))}
      </div>

      <div className="disclaimer">
        ⚠ For academic and research purposes only. Not intended for clinical use without physician oversight.
      </div>
    </div>
  );
};

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const AppShell = ({ theme, toggleTheme }) => (
  <>
    <Navbar theme={theme} toggleTheme={toggleTheme} />
    <main className="main-content">
      <Routes>
        {/* Landing */}
        <Route path="/"               element={<LandingPage />}        />

        {/* AI Detection Modules */}
        <Route path="/pcos"           element={<PCOSPage />}           />
        <Route path="/ovarian"        element={<OvarianPage />}        />
        <Route path="/menstrual"      element={<MenstrualPage />}      />
        <Route path="/endometriosis"  element={<EndometriosisPage />}  />
        <Route path="/fibroid"        element={<FibroidPage />}        />

        {/* Health Tools */}
        <Route path="/symptom-checker" element={<SymptomCheckerPage />} />
        <Route path="/exercise"        element={<ExerciseHubPage />}    />
        <Route path="/diet"            element={<DietHubPage />}        />
        <Route path="/assistant"       element={<AssistantPage />}      />

        {/* Platform */}
        <Route path="/dashboard"      element={<DashboardPage />}      />
        <Route path="/model-stats"    element={<ModelStatsPage />}     />
        <Route path="/quiz"           element={<SymptomQuizPage />}    />
      </Routes>
    </main>
    <Footer />
  </>
);

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('nc_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <Router>
      <AppShell theme={theme} toggleTheme={toggleTheme} />
    </Router>
  );
}

export default App;
