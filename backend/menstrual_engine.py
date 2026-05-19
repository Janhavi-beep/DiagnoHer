"""
menstrual_engine.py
─────────────────────────────────────────────────────────────────────────────
Rule-Based Menstrual Irregularity Classification Engine
6 classes: normal, oligomenorrhea, amenorrhea, polymenorrhea,
           menorrhagia, dysmenorrhea, pcos_linked

Clinical reference:
  - ACOG Practice Bulletin on Abnormal Uterine Bleeding
  - Rotterdam ESHRE/ASRM PCOS criteria
  - FIGO classification of AUB (PALM-COEIN)

Add to app.py:
  from menstrual_engine import menstrual_bp
  app.register_blueprint(menstrual_bp)
─────────────────────────────────────────────────────────────────────────────
"""

from flask import Blueprint, request, jsonify

menstrual_bp = Blueprint("menstrual", __name__)


# ══════════════════════════════════════════════════════════════════════════════
# CLINICAL KNOWLEDGE BASE
# ══════════════════════════════════════════════════════════════════════════════

CLASSIFICATIONS = {
    "normal": {
        "label":       "Normal Cycle",
        "description": "Cycle parameters fall within clinically normal ranges. "
                       "No significant irregularities detected.",
        "severity":    "Low",
    },
    "oligomenorrhea": {
        "label":       "Oligomenorrhea",
        "description": "Infrequent menstrual cycles with intervals exceeding 35 days. "
                       "Often associated with hormonal imbalance, thyroid dysfunction, or PCOS.",
        "severity":    "Moderate",
    },
    "amenorrhea": {
        "label":       "Amenorrhea",
        "description": "Absence of menstruation for 90+ days (secondary amenorrhea). "
                       "Requires evaluation for hypothalamic, pituitary, ovarian, or uterine causes.",
        "severity":    "High",
    },
    "polymenorrhea": {
        "label":       "Polymenorrhea",
        "description": "Abnormally frequent cycles occurring less than 21 days apart. "
                       "May indicate ovulatory dysfunction or uterine pathology.",
        "severity":    "Moderate",
    },
    "menorrhagia": {
        "label":       "Menorrhagia",
        "description": "Abnormally heavy or prolonged menstrual bleeding. "
                       "Associated with fibroids, coagulation disorders, or hormonal imbalance.",
        "severity":    "High",
    },
    "dysmenorrhea": {
        "label":       "Dysmenorrhea",
        "description": "Painful menstruation with significant impact on daily function. "
                       "Primary dysmenorrhea is cycle-associated; secondary may indicate endometriosis.",
        "severity":    "Moderate",
    },
    "pcos_linked": {
        "label":       "PCOS-Linked Irregularity",
        "description": "Menstrual pattern consistent with Polycystic Ovary Syndrome. "
                       "Characterised by oligo/anovulation, often with hyperandrogenism markers.",
        "severity":    "High",
    },
}

RECOMMENDATIONS = {
    "normal": [
        "Continue routine gynaecological check-ups every 12 months.",
        "Track cycle length monthly to detect drift over time.",
        "Maintain healthy BMI and sleep schedule to support hormonal balance.",
    ],
    "oligomenorrhea": [
        "Consult a gynaecologist for hormonal panel (FSH, LH, prolactin, thyroid).",
        "Rule out PCOS with pelvic ultrasound if not already done.",
        "Evaluate lifestyle factors: stress, exercise intensity, and nutritional status.",
        "Consider basal body temperature charting to assess ovulation.",
    ],
    "amenorrhea": [
        "Seek urgent gynaecological evaluation — secondary amenorrhea >90 days requires workup.",
        "Obtain serum hCG (pregnancy test), FSH, LH, prolactin, and TSH.",
        "Assess for hypothalamic causes: low BMI, excessive exercise, or eating disorders.",
        "Bone density screening if amenorrhea persists >6 months due to oestrogen deficiency risk.",
    ],
    "polymenorrhea": [
        "Pelvic ultrasound to rule out structural causes (fibroids, polyps).",
        "Hormonal evaluation mid-cycle to assess ovulation.",
        "Iron studies recommended due to increased blood loss frequency.",
        "Track exact cycle dates for 3 months to confirm pattern.",
    ],
    "menorrhagia": [
        "Full blood count to assess for iron-deficiency anaemia.",
        "Pelvic ultrasound to rule out fibroids, adenomyosis, or endometrial polyps.",
        "Consider coagulation screen if heavy bleeding since menarche.",
        "Hormonal therapy or tranexamic acid may be considered pending evaluation.",
    ],
    "dysmenorrhea": [
        "Consider NSAIDs (e.g. ibuprofen) starting 1-2 days before expected period.",
        "Pelvic examination and ultrasound to exclude secondary causes (endometriosis).",
        "Heat therapy and physiotherapy may provide symptomatic relief.",
        "Laparoscopy may be indicated if pain is refractory and endometriosis is suspected.",
    ],
    "pcos_linked": [
        "Confirm PCOS diagnosis with Rotterdam criteria (2 of 3): oligo-anovulation, "
        "hyperandrogenism, polycystic ovaries on ultrasound.",
        "Fasting glucose and insulin resistance screening.",
        "Lifestyle modification: weight management, low-GI diet, regular exercise.",
        "Discuss hormonal therapy options with endocrinologist or reproductive specialist.",
        "Annual lipid panel and blood pressure monitoring due to metabolic risk.",
    ],
}

STATUS_COLORS = {
    "normal":   "#48bb78",
    "short":    "#f6ad55",
    "long":     "#ed8936",
    "very_long":"#fc8181",
    "heavy":    "#fc8181",
    "light":    "#63b3ed",
    "severe":   "#fc8181",
    "moderate": "#ed8936",
    "mild":     "#48bb78",
}


# ══════════════════════════════════════════════════════════════════════════════
# RULE ENGINE
# ══════════════════════════════════════════════════════════════════════════════

def classify_menstrual(data: dict) -> dict:
    """
    Pure rule-based classification.
    All rules are explicit, traceable, and clinically referenced.
    Returns full result dict ready for JSON serialisation.
    """

    # ── Parse inputs ──────────────────────────────────────────────────────────
    cycle_len    = float(data.get("cycle_length",     28))
    period_dur   = float(data.get("period_duration",   5))
    days_since   = float(data.get("last_period_days", 14))
    flow         = int(data.get("flow_heaviness",      3))   # 1-5
    pain         = int(data.get("pain_level",          1))   # 1-10
    symptoms     = data.get("symptoms",               [])
    known_pcos   = bool(data.get("known_pcos",      False))
    age          = int(data.get("age", 0)) if data.get("age") else 0

    triggered_rules = []
    scores = {k: 0 for k in CLASSIFICATIONS}

    # ── Rule set ──────────────────────────────────────────────────────────────

    # AMENORRHEA
    if days_since >= 90:
        scores["amenorrhea"] += 10
        triggered_rules.append(f"Last period {days_since:.0f} days ago (threshold: ≥90 days)")

    if cycle_len > 90:
        scores["amenorrhea"] += 6
        triggered_rules.append(f"Reported cycle length {cycle_len:.0f} days (>90 days)")

    # OLIGOMENORRHEA
    if 35 < cycle_len <= 90:
        scores["oligomenorrhea"] += 8
        triggered_rules.append(f"Cycle length {cycle_len:.0f} days (oligomenorrhea: 35–90 days)")

    if 35 < days_since < 90:
        scores["oligomenorrhea"] += 5
        triggered_rules.append(f"Days since last period: {days_since:.0f} (infrequent pattern)")

    # POLYMENORRHEA
    if cycle_len < 21:
        scores["polymenorrhea"] += 9
        triggered_rules.append(f"Cycle length {cycle_len:.0f} days (polymenorrhea: <21 days)")

    # MENORRHAGIA
    if flow >= 4:
        scores["menorrhagia"] += 7
        triggered_rules.append(f"Flow heaviness {flow}/5 (heavy to very heavy)")

    if period_dur > 7:
        scores["menorrhagia"] += 6
        triggered_rules.append(f"Period duration {period_dur:.0f} days (prolonged: >7 days)")

    if flow >= 4 and period_dur > 7:
        scores["menorrhagia"] += 4
        triggered_rules.append("Combined heavy flow + prolonged duration (high menorrhagia indicator)")

    if "clotting" in symptoms:
        scores["menorrhagia"] += 3
        triggered_rules.append("Symptom: heavy clotting reported")

    # DYSMENORRHEA
    if pain >= 7:
        scores["dysmenorrhea"] += 8
        triggered_rules.append(f"Pain level {pain}/10 (severe: ≥7)")

    if pain >= 5:
        scores["dysmenorrhea"] += 4

    if "cramping" in symptoms:
        scores["dysmenorrhea"] += 3
        triggered_rules.append("Symptom: severe cramping reported")

    if pain >= 5 and "cramping" in symptoms:
        scores["dysmenorrhea"] += 3
        triggered_rules.append("Combined high pain + cramping (dysmenorrhea pattern)")

    # PCOS-LINKED
    pcos_signals = 0

    if known_pcos:
        scores["pcos_linked"] += 10
        pcos_signals += 1
        triggered_rules.append("Known PCOS diagnosis confirmed by user")

    if cycle_len > 35 or days_since > 35:
        pcos_signals += 1

    if "acne" in symptoms:
        scores["pcos_linked"] += 3
        pcos_signals += 1
        triggered_rules.append("Symptom: hormonal acne (hyperandrogenism marker)")

    if "hair_loss" in symptoms:
        scores["pcos_linked"] += 3
        pcos_signals += 1
        triggered_rules.append("Symptom: hair thinning / loss (hyperandrogenism marker)")

    if "mood_swings" in symptoms and cycle_len > 35:
        scores["pcos_linked"] += 2
        triggered_rules.append("Mood swings with long cycle (hormonal dysregulation pattern)")

    if pcos_signals >= 2:
        scores["pcos_linked"] += 5

    if pcos_signals >= 3:
        scores["pcos_linked"] += 4
        triggered_rules.append(f"{pcos_signals} PCOS-associated signals detected")

    # NORMAL baseline
    if 21 <= cycle_len <= 35 and 2 <= period_dur <= 7 and flow <= 3 and pain <= 4:
        scores["normal"] += 8

    if 25 <= cycle_len <= 31:
        scores["normal"] += 3

    # ── Determine classification ───────────────────────────────────────────────
    # Priority override: amenorrhea always wins if strongly triggered
    if scores["amenorrhea"] >= 10:
        classification = "amenorrhea"
    else:
        classification = max(scores, key=scores.get)
        # If top score is 0 or all tied at normal range → normal
        if scores[classification] == 0:
            classification = "normal"

    meta        = CLASSIFICATIONS[classification]
    recs        = RECOMMENDATIONS[classification]

    # ── Cycle status labels ────────────────────────────────────────────────────
    if cycle_len < 21:
        cycle_status, cycle_color = "Too short", STATUS_COLORS["short"]
    elif cycle_len <= 35:
        cycle_status, cycle_color = "Normal range", STATUS_COLORS["normal"]
    elif cycle_len <= 90:
        cycle_status, cycle_color = "Infrequent", STATUS_COLORS["long"]
    else:
        cycle_status, cycle_color = "Very long", STATUS_COLORS["very_long"]

    flow_labels = {1: "Spotting", 2: "Light", 3: "Normal", 4: "Heavy", 5: "Very Heavy"}
    flow_colors = {1: STATUS_COLORS["light"], 2: STATUS_COLORS["light"],
                   3: STATUS_COLORS["normal"], 4: STATUS_COLORS["heavy"],
                   5: STATUS_COLORS["heavy"]}
    flow_status = flow_labels.get(flow, "Normal")
    flow_color  = flow_colors.get(flow, STATUS_COLORS["normal"])

    if pain <= 2:
        pain_status, pain_color = "Minimal", STATUS_COLORS["mild"]
    elif pain <= 4:
        pain_status, pain_color = "Mild", STATUS_COLORS["mild"]
    elif pain <= 6:
        pain_status, pain_color = "Moderate", STATUS_COLORS["moderate"]
    elif pain <= 8:
        pain_status, pain_color = "Severe", STATUS_COLORS["severe"]
    else:
        pain_status, pain_color = "Debilitating", STATUS_COLORS["severe"]

    # ── PCOS correlation message ───────────────────────────────────────────────
    pcos_correlation = None
    if pcos_signals >= 2 or known_pcos:
        pcos_correlation = (
            "Cycle pattern shows correlation with PCOS. "
            "Cross-reference with ultrasound findings from the PCOS Detection module "
            "for a complete Rotterdam criteria assessment."
        )

    return {
        "classification":    classification,
        "severity":          meta["severity"],
        "description":       meta["description"],
        "triggered_rules":   triggered_rules,
        "recommendations":   recs,
        "cycle_status":      cycle_status,
        "cycle_status_color":cycle_color,
        "flow_status":       flow_status,
        "flow_status_color": flow_color,
        "pain_status":       pain_status,
        "pain_status_color": pain_color,
        "pcos_correlation":  pcos_correlation,
        "scores":            scores,   # useful for debugging
    }


# ══════════════════════════════════════════════════════════════════════════════
# FLASK ROUTE
# ══════════════════════════════════════════════════════════════════════════════

@menstrual_bp.route("/predict/menstrual", methods=["POST"])
def predict_menstrual():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON body received."}), 400

    # Basic validation
    required = ["cycle_length", "period_duration", "last_period_days"]
    missing  = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        cycle_len  = float(data["cycle_length"])
        period_dur = float(data["period_duration"])
        days_since = float(data["last_period_days"])
    except (ValueError, TypeError):
        return jsonify({"error": "Cycle fields must be numeric."}), 400

    if not (5 <= cycle_len <= 365):
        return jsonify({"error": "Cycle length must be between 5 and 365 days."}), 400
    if not (1 <= period_dur <= 30):
        return jsonify({"error": "Period duration must be between 1 and 30 days."}), 400
    if not (0 <= days_since <= 730):
        return jsonify({"error": "Days since last period must be between 0 and 730."}), 400

    result = classify_menstrual(data)
    return jsonify(result)