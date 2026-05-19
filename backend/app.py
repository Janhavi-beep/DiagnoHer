"""
Neural-Core Backend · app.py
─────────────────────────────────────────────────────────────────────────────
TRACK 1 — PCOS DETECTION        (ResNet50, 2-class, threshold=0.25)
TRACK 2 — OVARIAN PATHOLOGY     (ResNet50, 5-class, argmax)
TRACK 3 — FOLLICLE COUNT        (YOLOv8)
TRACK 4 — MENSTRUAL IRREGULARITY (Rule-based engine  — menstrual_engine.py)
TRACK 5 — ENDOMETRIOSIS RISK    (XGBoost             — ml_engines.py)
TRACK 6 — FIBROID DETECTION     (3-model pipeline    — fibroid_engine.py)
─────────────────────────────────────────────────────────────────────────────
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io, base64, os
import cv2
import numpy as np
from ultralytics import YOLO
from menstrual_engine import menstrual_bp
from ml_engines import ml_bp
from fibroid_engine import fibroid_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(menstrual_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(fibroid_bp)

# ==============================================================================
# 1. CONFIGURATION
# ==============================================================================

MODEL_DIR           = "models"
PCOS_RESNET_PATH    = os.path.join(MODEL_DIR, "pcos_resnet_v3.pt")
OVARIAN_RESNET_PATH = os.path.join(MODEL_DIR, "ovarian_multiclass_v1.pt")
YOLO_PATH           = os.path.join(MODEL_DIR, "best.pt")

MAX_FILE_SIZE_MB    = 10
ALLOWED_MIME        = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
PCOS_THRESHOLD      = 0.25

OVARIAN_CLASSES = [
    {"key": "complex_cyst",  "label": "Complex Cyst"            },
    {"key": "follicle",      "label": "Dominant Follicle"       },
    {"key": "normal",        "label": "Healthy Ovary"           },
    {"key": "pcos",          "label": "Polycystic Ovary (PCOS)" },
    {"key": "serous_cyst",   "label": "Simple Cyst"             },
]


def compute_pcos_risk(pcos_positive: bool, follicle_count: int, ovarian_key: str) -> str:
    high_ovarian = {"pcos", "complex_cyst"}
    mod_ovarian  = {"serous_cyst", "follicle"}
    if pcos_positive or follicle_count >= 12 or ovarian_key in high_ovarian:
        return "High"
    if follicle_count >= 8 or ovarian_key in mod_ovarian:
        return "Moderate"
    return "Low"


# ==============================================================================
# 2. MODEL ARCHITECTURES
# ==============================================================================

def build_pcos_resnet() -> nn.Module:
    m = models.resnet50()
    m.fc = nn.Sequential(
        nn.Linear(m.fc.in_features, 512),
        nn.BatchNorm1d(512),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(512, 2),
    )
    return m


def build_ovarian_resnet() -> nn.Module:
    m = models.resnet50()
    m.fc = nn.Sequential(
        nn.Linear(m.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, len(OVARIAN_CLASSES)),
    )
    return m


# ==============================================================================
# 3. MODEL LOADING
# ==============================================================================

def load_all_models():
    pcos_net = ovarian_net = yolo = None

    try:
        pcos_net = build_pcos_resnet()
        pcos_net.load_state_dict(torch.load(PCOS_RESNET_PATH, map_location="cpu"))
        pcos_net.eval()
        print("OK  PCOS ResNet50 (2-class) loaded.")
    except Exception as e:
        print(f"ERR PCOS ResNet load failed: {e}")

    try:
        ovarian_net = build_ovarian_resnet()
        ovarian_net.load_state_dict(torch.load(OVARIAN_RESNET_PATH, map_location="cpu"))
        ovarian_net.eval()
        print("OK  Ovarian ResNet50 (5-class) loaded.")
    except Exception as e:
        print(f"ERR Ovarian ResNet load failed: {e}")

    try:
        yolo = YOLO(YOLO_PATH)
        print("OK  YOLOv8 follicle detector loaded.")
    except Exception as e:
        print(f"ERR YOLO load failed: {e}")

    return pcos_net, ovarian_net, yolo


pcos_model, ovarian_model, yolo_model = load_all_models()

# ==============================================================================
# 4. PREPROCESSING
# ==============================================================================

resnet_preprocess = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# ==============================================================================
# 5. HELPERS
# ==============================================================================

def validate_file(file):
    if not file or file.filename == "":
        return "No file provided."
    mime = file.content_type or ""
    if mime not in ALLOWED_MIME:
        return f"Unsupported file type '{mime}'. Upload a JPEG or PNG."
    file.seek(0, 2)
    size_mb = file.tell() / (1024 * 1024)
    file.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        return f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_SIZE_MB} MB."
    return None

# ==============================================================================
# 6. ROUTES
# ==============================================================================

# ── Root — tells you the backend is alive when you open http://127.0.0.1:5000
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service":      "NeuralCore v4.0 PRO — Backend API",
        "status":       "running",
        "frontend":     "http://localhost:5173  (run: cd frontend && npm run dev)",
        "endpoints": {
            "health":              "GET  /health",
            "pcos_ovarian":        "POST /predict          (form-data: image)",
            "menstrual":           "POST /predict/menstrual (json body)",
            "endometriosis":       "POST /predict/endometriosis (json body)",
            "fibroid":             "POST /predict/fibroid  (form-data: image)",
            "fibroid_model_status":"GET  /models/fibroid/status",
        },
        "note": "Open http://localhost:5173 in your browser — NOT this port.",
    })


# ── Health check (used by React frontend to verify backend is up)
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":         "ok",
        "pcos_model":     pcos_model    is not None,
        "ovarian_model":  ovarian_model is not None,
        "yolo_loaded":    yolo_model    is not None,
        "pcos_threshold": PCOS_THRESHOLD,
    })


# ── PCOS + Ovarian prediction (image upload)
@app.route("/predict", methods=["POST"])
def predict():

    missing = [n for n, m in [("PCOS ResNet",    pcos_model),
                               ("Ovarian ResNet", ovarian_model),
                               ("YOLO",           yolo_model)] if not m]
    if missing:
        return jsonify({"error": f"Models not loaded: {', '.join(missing)}"}), 500

    file = request.files.get("image")
    err  = validate_file(file)
    if err:
        return jsonify({"error": err}), 400

    img_bytes = file.read()
    try:
        img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return jsonify({"error": "Cannot decode image."}), 400

    input_tensor = resnet_preprocess(img_pil).unsqueeze(0)

    # ── TRACK 1: PCOS (2-class, threshold=0.25)
    with torch.no_grad():
        pcos_probs = F.softmax(pcos_model(input_tensor), dim=1)[0]

    pcos_prob     = pcos_probs[1].item()
    pcos_positive = pcos_prob >= PCOS_THRESHOLD

    # ── TRACK 2: OVARIAN PATHOLOGY (5-class)
    with torch.no_grad():
        ov_probs = F.softmax(ovarian_model(input_tensor), dim=1)[0]

    top_idx   = ov_probs.argmax().item()
    top_class = OVARIAN_CLASSES[top_idx]
    top_conf  = ov_probs[top_idx].item()
    all_scores = {
        cls["key"]: round(ov_probs[i].item(), 4)
        for i, cls in enumerate(OVARIAN_CLASSES)
    }

    # ── TRACK 3: FOLLICLE COUNT (YOLOv8)
    nparr  = np.frombuffer(img_bytes, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    yolo_results   = yolo_model.predict(img_cv, conf=0.35, iou=0.40,
                                        agnostic_nms=True, verbose=False)
    follicle_count = len(yolo_results[0].boxes)

    annotated   = yolo_results[0].plot()
    _, yolo_buf = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    yolo_b64    = base64.b64encode(yolo_buf).decode("utf-8")

    # ── UNIFIED RESPONSE
    pcos_risk = compute_pcos_risk(pcos_positive, follicle_count, top_class["key"])

    return jsonify({
        "pcos_analysis": {
            "status":           "PCOS Criteria Met" if pcos_positive else "Normal Distribution",
            "follicle_count":    follicle_count,
            "pcos_risk":         pcos_risk,
            "pcos_positive":     pcos_positive,
            "pcos_probability":  round(pcos_prob, 4),
        },
        "ovarian_analysis": {
            "diagnosis":  top_class["label"],
            "type":       top_class["key"],
            "confidence": round(top_conf, 4),
            "all_scores": all_scores,
        },
        "detection_image": f"data:image/jpeg;base64,{yolo_b64}",
    })


# ==============================================================================
if __name__ == "__main__":
    app.run(port=5000, debug=True, use_reloader=False)
