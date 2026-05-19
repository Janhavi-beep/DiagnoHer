"""
ml_engines.py
─────────────────────────────────────────────────────────────────────────────
Flask Blueprint — Endometriosis prediction route only

ENDOMETRIOSIS:  XGBoost model (endometriosis_xgb.pkl)
                Falls back to rule engine if model not found

Add to app.py:
    from ml_engines import ml_bp
    app.register_blueprint(ml_bp)

Models go in:  backend/models/
    endometriosis_xgb.pkl
    endo_scaler.pkl
    endo_feature_names.json
    endo_classes.json
─────────────────────────────────────────────────────────────────────────────
"""

from flask import Blueprint, request, jsonify
import os, json, warnings
import numpy as np

# Suppress sklearn/xgboost version mismatch warnings (Kaggle vs local env)
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
warnings.filterwarnings("ignore", category=UserWarning, module="xgboost")

ml_bp = Blueprint("ml", __name__)
MODEL_DIR = "models"

# ══════════════════════════════════════════════════════════════════════════════
# LAZY MODEL LOADING
# ══════════════════════════════════════════════════════════════════════════════

_endo_model  = None
_endo_scaler = None
_endo_feats  = None
_endo_classes = None


def _load_endo():
    global _endo_model, _endo_scaler, _endo_feats, _endo_classes
    if _endo_model is not None:
        return True
    try:
        import joblib
        _endo_model  = joblib.load(os.path.join(MODEL_DIR, "endometriosis_xgb.pkl"))
        _endo_scaler = joblib.load(os.path.join(MODEL_DIR, "endo_scaler.pkl"))
        with open(os.path.join(MODEL_DIR, "endo_feature_names.json")) as f:
            _endo_feats = json.load(f)
        with open(os.path.join(MODEL_DIR, "endo_classes.json")) as f:
            _endo_classes = json.load(f)
        print("OK  Endometriosis XGBoost loaded.")
        return True
    except Exception as e:
        print(f"WARN Endometriosis model not found, using rule engine: {e}")
        return False


# ══════════════════════════════════════════════════════════════════════════════
# ENDOMETRIOSIS KNOWLEDGE BASE
# ══════════════════════════════════════════════════════════════════════════════

ENDO_RISK_DESCRIPTIONS = {
    "Low": (
        "Symptom profile does not strongly indicate endometriosis. "
        "Low risk does not rule out subclinical disease — monitor for symptom progression."
    ),
    "Moderate": (
        "Several symptoms consistent with endometriosis are present. "
        "Clinical evaluation recommended, including pelvic examination and ultrasound."
    ),
    "High": (
        "Multiple high-specificity endometriosis indicators detected. "
        "Strong clinical suspicion — gynaecological referral and imaging advised urgently."
    ),
}

ENDO_RECOMMENDATIONS = {
    "Low": [
        "Track symptoms monthly — especially pelvic pain and cycle changes.",
        "Return if dysmenorrhea worsens or new symptoms develop.",
        "Discuss findings with a gynaecologist at next routine visit.",
    ],
    "Moderate": [
        "Schedule a pelvic ultrasound to rule out endometriomas (chocolate cysts).",
        "Consider CA-125 serum test — elevated in ~80% of stage III/IV endometriosis.",
        "Keep a pain diary for 2-3 cycles to quantify severity objectively.",
        "NSAIDs or hormonal therapy may be trialled for symptomatic relief.",
        "Referral to a specialist endometriosis centre is recommended.",
    ],
    "High": [
        "Urgent gynaecological referral — laparoscopy is the gold standard for diagnosis.",
        "Transvaginal ultrasound to assess for ovarian endometriomas and deep infiltrating disease.",
        "CA-125 serum level should be measured immediately.",
        "Discuss fertility implications if conception is desired.",
        "Hormonal suppression therapy (GnRH agonists, progestins) may be initiated.",
        "Multidisciplinary care with colorectal surgeon if bowel involvement suspected.",
    ],
}


# ══════════════════════════════════════════════════════════════════════════════
# RULE ENGINE (fallback when model not available)
# ══════════════════════════════════════════════════════════════════════════════

def _rule_endo(data: dict) -> dict:
    pain       = int(data.get("pain_score",     1))
    flow       = int(data.get("flow_heaviness", 3))
    symptoms   = data.get("symptoms",           [])
    known_pcos = bool(data.get("known_pcos",  False))
    prior_surg = bool(data.get("prior_surgery", False))
    cycle_len  = float(data.get("cycle_length", 28) or 28)
    ca125      = data.get("ca125", "")
    age        = int(data.get("age", 30) or 30)

    score = 0
    indicators = []

    HIGH_SPECIFICITY = ["dyspareunia", "bowel_symptoms", "ovarian_cyst", "infertility"]
    MOD_SPECIFICITY  = ["pelvic_pain", "dysmenorrhea", "back_pain", "heavy_bleeding"]

    for s in symptoms:
        if s in HIGH_SPECIFICITY:
            score += 3
            indicators.append(f"High-specificity symptom: {s.replace('_', ' ').title()}")
        elif s in MOD_SPECIFICITY:
            score += 2

    if pain >= 7:
        score += 4
        indicators.append(f"Severe pelvic pain (score {pain}/10)")
    elif pain >= 5:
        score += 2

    if flow >= 4:
        score += 2
        indicators.append("Heavy menstrual flow")

    if cycle_len > 35:
        score += 1

    if "family_history" in symptoms:
        score += 3
        indicators.append("Family history of endometriosis (7x increased risk)")

    if known_pcos:
        score += 2
        indicators.append("Known PCOS — co-occurrence with endometriosis is common")

    if prior_surg:
        score += 1
        indicators.append("Prior pelvic surgery — adhesion risk factor")

    if ca125 and str(ca125).strip():
        try:
            ca125_val = float(ca125)
            if ca125_val > 35:
                score += 4
                indicators.append(f"Elevated CA-125: {ca125_val} U/mL (normal <35)")
        except ValueError:
            pass

    if age < 20 or 25 <= age <= 40:
        score += 1

    if score >= 10:
        risk = "High"
    elif score >= 5:
        risk = "Moderate"
    else:
        risk = "Low"

    risk_score = min(score / 18.0, 1.0)

    cross_module = None
    if known_pcos:
        cross_module = (
            "PCOS detected: Endometriosis and PCOS co-occur in ~30% of cases. "
            "Overlapping symptoms like heavy bleeding and pelvic pain require careful differential diagnosis."
        )
    elif "dysmenorrhea" in symptoms and cycle_len > 35:
        cross_module = (
            "Menstrual module correlation: oligomenorrhea combined with dysmenorrhea "
            "increases endometriosis probability — these findings are complementary."
        )

    return {
        "risk_level":      risk,
        "risk_score":      round(risk_score, 4),
        "confidence":      round(0.72 + risk_score * 0.1, 4),
        "description":     ENDO_RISK_DESCRIPTIONS[risk],
        "key_indicators":  indicators,
        "recommendations": ENDO_RECOMMENDATIONS[risk],
        "cross_module":    cross_module,
        "model_used":      "rule_engine",
    }


# ══════════════════════════════════════════════════════════════════════════════
# XGBOOST INFERENCE
# ══════════════════════════════════════════════════════════════════════════════

def _ml_endo(data: dict) -> dict:
    row = {feat: 0.0 for feat in _endo_feats}

    field_map = {
        "age":             "age",
        "pain_score":      "pain_score",
        "cycle_length":    "cycle_length",
        "period_duration": "period_duration",
        "flow_heaviness":  "flow_heaviness",
        "known_pcos":      "known_pcos",
        "prior_surgery":   "prior_surgery",
        "ca125":           "ca125",
    }
    for form_key, feat_key in field_map.items():
        if feat_key in row and data.get(form_key) not in (None, ""):
            try:
                row[feat_key] = float(data[form_key])
            except (ValueError, TypeError):
                pass

    for s in data.get("symptoms", []):
        if s in row:
            row[s] = 1.0

    X        = np.array([[row[f] for f in _endo_feats]])
    X_scaled = _endo_scaler.transform(X)

    proba      = _endo_model.predict_proba(X_scaled)[0]
    pred       = _endo_model.predict(X_scaled)[0]
    pred_class = _endo_classes[int(pred)]
    confidence = float(proba.max())

    pred_lower = str(pred_class).lower()
    if any(w in pred_lower for w in ["high", "stage 3", "stage 4", "severe", "2", "yes", "positive"]):
        risk = "High"
    elif any(w in pred_lower for w in ["moderate", "stage 2", "mild", "1", "possible"]):
        risk = "Moderate"
    else:
        risk = "Low"

    risk_score  = float(proba[2]) if len(proba) > 2 else float(proba[-1])
    rule_result = _rule_endo(data)

    return {
        "risk_level":      risk,
        "risk_score":      round(risk_score, 4),
        "confidence":      round(confidence, 4),
        "description":     ENDO_RISK_DESCRIPTIONS.get(risk, ""),
        "key_indicators":  rule_result["key_indicators"],
        "recommendations": ENDO_RECOMMENDATIONS.get(risk, []),
        "cross_module":    rule_result["cross_module"],
        "model_used":      "xgboost",
        "predicted_class": pred_class,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@ml_bp.route("/predict/endometriosis", methods=["POST"])
def predict_endometriosis():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON body received."}), 400

    if not data.get("age"):
        return jsonify({"error": "Age is required."}), 400

    try:
        age = float(data["age"])
        if not (10 <= age <= 70):
            return jsonify({"error": "Age must be between 10 and 70."}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Age must be a number."}), 400

    model_ok = _load_endo()
    result   = _ml_endo(data) if model_ok else _rule_endo(data)
    return jsonify(result)


@ml_bp.route("/models/status", methods=["GET"])
def model_status():
    endo_ok = _load_endo()
    return jsonify({
        "endometriosis_model": "xgboost" if endo_ok else "rule_engine",
    })
