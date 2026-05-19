"""
fibroid_engine.py
─────────────────────────────────────────────────────────────────────────────
Flask Blueprint — Fibroid Detection & Characterization

Pipeline:
  1. YOLOv8m  — detection + bounding boxes
  2. ResNet50 + ConvAutoencoder fusion — size / location / texture
  3. MC Dropout (20 passes) — uncertainty estimation
  4. GradCAM++ on cropped ROI — explainability
  5. FSI scoring — severity 0-100
  6. Growth simulation — 12-month projection
  7. Clinical reasoning — FIGO/ACOG/NICE referenced

Add to app.py:
    from fibroid_engine import fibroid_bp
    app.register_blueprint(fibroid_bp)

Models go in: backend/models/
    fibroid_yolo.pt
    fibroid_resnet.pt
    fibroid_autoencoder.pt
    fibroid_metadata.json
─────────────────────────────────────────────────────────────────────────────
"""

from flask import Blueprint, request, jsonify
import os, json, base64, warnings, io
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning)

fibroid_bp = Blueprint("fibroid", __name__)
MODEL_DIR  = "models"

# ══════════════════════════════════════════════════════════════════════════════
# LAZY MODEL LOADING
# ══════════════════════════════════════════════════════════════════════════════

_yolo_model      = None
_resnet_model    = None
_ae_model        = None
_metadata        = None
_yolo_loaded     = False   # YOLO only — enables basic detection
_full_loaded     = False   # YOLO + ResNet + AE — enables characterization


def _load_yolo():
    """Load YOLO only. Used for basic detection when ResNet not yet trained."""
    global _yolo_model, _yolo_loaded
    if _yolo_loaded:
        return True
    try:
        from ultralytics import YOLO
        path = os.path.join(MODEL_DIR, "fibroid_yolo.pt")
        if not os.path.exists(path):
            return False
        _yolo_model = YOLO(path)
        _yolo_loaded = True
        print("OK  Fibroid YOLOv8 loaded.")
        return True
    except Exception as e:
        print(f"WARN YOLO load failed: {e}")
        return False


def _load_models():
    global _yolo_model, _resnet_model, _ae_model, _metadata, _yolo_loaded, _full_loaded
    if _full_loaded:
        return True
    # Always try YOLO first
    _load_yolo()
    resnet_path = os.path.join(MODEL_DIR, "fibroid_resnet.pt")
    ae_path     = os.path.join(MODEL_DIR, "fibroid_autoencoder.pt")
    if not os.path.exists(resnet_path) or not os.path.exists(ae_path):
        return False
    try:
        import torch
        import torch.nn as nn
        import timm
        import torchvision.models as tv_models
        from ultralytics import YOLO

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Ensure YOLO loaded
        if not _yolo_loaded:
            _yolo_model = YOLO(os.path.join(MODEL_DIR, "fibroid_yolo.pt"))
            _yolo_loaded = True

        # Load metadata
        meta_path = os.path.join(MODEL_DIR, "fibroid_metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                _metadata = json.load(f)

        # ── Rebuild autoencoder architecture ────────────────────────────────
        class FibroidAutoencoder(nn.Module):
            def __init__(self, latent_dim=512):
                super().__init__()
                self.encoder = nn.Sequential(
                    nn.Conv2d(1,  32,  3, stride=2, padding=1), nn.BatchNorm2d(32),  nn.ReLU(),
                    nn.Conv2d(32, 64,  3, stride=2, padding=1), nn.BatchNorm2d(64),  nn.ReLU(),
                    nn.Conv2d(64, 128, 3, stride=2, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
                    nn.Conv2d(128,256, 3, stride=2, padding=1), nn.BatchNorm2d(256), nn.ReLU(),
                    nn.Conv2d(256,512, 3, stride=2, padding=1), nn.BatchNorm2d(512), nn.ReLU(),
                )
                self.flatten   = nn.Flatten()
                self.fc_encode = nn.Linear(512*7*7, latent_dim)

            def encode(self, x):
                return self.fc_encode(self.flatten(self.encoder(x)))

        # ── Rebuild ResNet architecture ──────────────────────────────────────
        class FibroidResNet(nn.Module):
            def __init__(self, ae, latent_dim=512, dropout_p=0.4):
                super().__init__()
                self.ae = ae
                for p in self.ae.parameters():
                    p.requires_grad = False
                # EfficientNetV2-S — matches Kaggle training notebook
                effnet = timm.create_model(
                    "tf_efficientnetv2_s",
                    pretrained=False,
                    num_classes=0,
                    global_pool="",
                )
                self.features = effnet
                self.pool     = nn.AdaptiveAvgPool2d(1)
                backbone_dim  = 1280          # EfficientNetV2-S output dim
                self.dropout1 = nn.Dropout(p=dropout_p)
                self.dropout2 = nn.Dropout(p=dropout_p)
                fused = backbone_dim + latent_dim  # 1280 + 512 = 1792
                self.fusion = nn.Sequential(
                    nn.Linear(fused, 1024), nn.LayerNorm(1024), nn.GELU(),
                    nn.Dropout(p=dropout_p),
                    nn.Linear(1024, 512),  nn.LayerNorm(512),  nn.GELU(),
                    nn.Dropout(p=dropout_p * 0.5),
                )
                self.head_detection = nn.Linear(512, 2)
                self.head_size      = nn.Linear(512, 4)
                self.head_location  = nn.Linear(512, 4)
                self.head_texture   = nn.Linear(512, 4)

            def forward(self, x):
                x_gray   = x.mean(dim=1, keepdim=True)
                ae_z     = self.dropout1(self.ae.encode(x_gray))
                feat_map = self.features(x)
                rf       = self.dropout2(self.pool(feat_map).flatten(1))
                feat     = self.fusion(torch.cat([rf, ae_z], dim=1))
                return {
                    "detection": self.head_detection(feat),
                    "size":      self.head_size(feat),
                    "location":  self.head_location(feat),
                    "texture":   self.head_texture(feat),
                }

        import torch
        ae = FibroidAutoencoder(512).to(device)
        ae.load_state_dict(torch.load(
            os.path.join(MODEL_DIR, "fibroid_autoencoder.pt"), map_location=device
        ), strict=False)
        ae.eval()
        _ae_model = ae

        resnet = FibroidResNet(ae).to(device)
        resnet.load_state_dict(torch.load(
            os.path.join(MODEL_DIR, "fibroid_resnet.pt"), map_location=device
        ), strict=False)
        resnet.eval()
        _resnet_model = resnet

        print("OK  Fibroid EfficientNetV2-S + Autoencoder loaded.")
        _full_loaded = True
        return True

    except Exception as e:
        import traceback
        print(f"WARN Fibroid model load failed: {e}")
        traceback.print_exc()
        return False


# ══════════════════════════════════════════════════════════════════════════════
# CLASS LABELS
# ══════════════════════════════════════════════════════════════════════════════

SIZE_CLASSES     = ["none", "small", "medium", "large"]
LOCATION_CLASSES = ["none", "subserosal", "intramural", "submucosal"]
TEXTURE_CLASSES  = ["none", "homogeneous", "heterogeneous", "calcified"]


# ══════════════════════════════════════════════════════════════════════════════
# MC DROPOUT PREDICT
# ══════════════════════════════════════════════════════════════════════════════

def _mc_predict(model, img_tensor, n_passes=20):
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    model.eval()
    for m in model.modules():
        if isinstance(m, nn.Dropout):
            m.train()

    device = next(model.parameters()).device
    tasks  = ["detection", "size", "location", "texture"]
    preds  = {t: [] for t in tasks}

    with torch.no_grad():
        for _ in range(n_passes):
            out = model(img_tensor.unsqueeze(0).to(device))
            for t in tasks:
                preds[t].append(F.softmax(out[t], dim=1).cpu().numpy())

    model.eval()
    results = {}
    for t in tasks:
        stack = np.stack(preds[t])[:, 0, :]
        mean  = stack.mean(0)
        std   = stack.std(0)
        pc    = mean.argmax()
        results[t] = {
            "pred_class":  int(pc),
            "confidence":  float(mean[pc]),
            "uncertainty": float(std[pc]),
        }
    return results


# ══════════════════════════════════════════════════════════════════════════════
# GRADCAM++ ON CROP
# ══════════════════════════════════════════════════════════════════════════════

def _run_gradcam(resnet_model, roi_bgr):
    """Run GradCAM++ on a cropped fibroid ROI. Returns base64 JPEG."""
    try:
        import torch
        import torch.nn as nn
        import torchvision.transforms as T
        import cv2
        import numpy as np
        from PIL import Image
        from pytorch_grad_cam import GradCAMPlusPlus
        from pytorch_grad_cam.utils.image import show_cam_on_image
        from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

        MEAN = np.array([0.485, 0.456, 0.406])
        STD  = np.array([0.229, 0.224, 0.225])

        class DetWrapper(nn.Module):
            def __init__(self, m): super().__init__(); self.m = m
            def forward(self, x): return self.m(x)["detection"]

        roi_rgb = cv2.cvtColor(cv2.resize(roi_bgr, (224,224)), cv2.COLOR_BGR2RGB)
        roi_pil = Image.fromarray(roi_rgb)
        tf = T.Compose([T.ToTensor(), T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])])
        roi_t = tf(roi_pil).unsqueeze(0).to(next(resnet_model.parameters()).device)

        wrapper = DetWrapper(resnet_model)

        # EfficientNetV2-S target layer: last block pointwise conv
        try:
            target_layer = [resnet_model.features.blocks[-1][-1].conv_pw]
        except (AttributeError, IndexError):
            target_layer = [list(resnet_model.features.children())[-1]]

        # Try GradCAM++ first; fall back to ScoreCAM if flat
        from pytorch_grad_cam import GradCAMPlusPlus, ScoreCAM
        gcam = None
        try:
            cam_gpp = GradCAMPlusPlus(model=wrapper, target_layers=target_layer)
            resnet_model.eval()
            with torch.enable_grad():
                gcam = cam_gpp(input_tensor=roi_t, targets=[ClassifierOutputTarget(1)])[0]
            if gcam.max() < 0.15:
                gcam = None
        except Exception as eg:
            print(f"GradCAM++ err: {eg}")

        if gcam is None:
            try:
                cam_sc = ScoreCAM(model=wrapper, target_layers=target_layer)
                with torch.no_grad():
                    gcam = cam_sc(input_tensor=roi_t, targets=[ClassifierOutputTarget(1)])[0]
            except Exception as es:
                print(f"ScoreCAM err: {es}")
                return None

        if gcam is None:
            return None

        gcam = cv2.resize(gcam, (224, 224))
        gcam = np.clip(gcam - np.percentile(gcam, 35), 0, None)
        if gcam.max() > 0:
            gcam = gcam / gcam.max()
        gcam = np.power(gcam, 0.45)

        roi_np = roi_t[0].cpu().numpy().transpose(1,2,0)
        roi_np = np.clip(roi_np * STD + MEAN, 0, 1).astype(np.float32)
        overlay = show_cam_on_image(roi_np, gcam, use_rgb=True)

        _, buf = cv2.imencode(".jpg", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR),
                              [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        return base64.b64encode(buf).decode("utf-8")

    except Exception as e:
        print(f"GradCAM failed: {e}")
        return None


# ══════════════════════════════════════════════════════════════════════════════
# FSI SCORING
# ══════════════════════════════════════════════════════════════════════════════

def _compute_fsi(det_conf, size, location, texture, uncertainty, num_fibroids):
    size_scores = {"none":0,"small":10,"medium":20,"large":30}
    loc_scores  = {"none":0,"subserosal":10,"intramural":18,"submucosal":25}
    tex_scores  = {"none":0,"homogeneous":5,"heterogeneous":10,"calcified":2}
    fsi = (
        det_conf * 25 +
        size_scores.get(size, 0) +
        loc_scores.get(location, 0) +
        tex_scores.get(texture, 0) +
        min((num_fibroids-1)*3, 10) -
        uncertainty * 10
    )
    fsi = round(max(0, min(100, fsi)), 1)
    sev = ("Minimal" if fsi < 25 else "Mild" if fsi < 45 else
           "Moderate" if fsi < 65 else "Severe" if fsi < 80 else "Critical")
    return fsi, sev


# ══════════════════════════════════════════════════════════════════════════════
# GROWTH SIMULATION
# ══════════════════════════════════════════════════════════════════════════════

def _simulate_growth(size_class, months=12):
    BASE = {"small":0.4,"medium":0.25,"large":0.12}
    INIT = {"small":1.5,"medium":4.5,"large":8.0}
    rate = BASE.get(size_class, 0.3)
    cm   = INIT.get(size_class, 3.0)
    proj = []
    for m in range(1, months+1):
        cm += rate + np.random.normal(0, rate*0.15)
        cm  = max(0.5, cm)
        proj.append({
            "month": m, "size_cm": round(cm, 2),
            "category": "small" if cm<3 else "medium" if cm<6 else "large"
        })
    return proj


# ══════════════════════════════════════════════════════════════════════════════
# CLINICAL REASONING
# ══════════════════════════════════════════════════════════════════════════════

def _clinical_reasoning(detection, size, location, texture,
                         fsi, sev, n_fibroids, uncertainty, growth):
    if detection != "Fibroid Detected":
        return {
            "summary": "No fibroid detected. Routine follow-up in 12 months.",
            "urgency": "Routine",
            "recommendations": ["Annual ultrasound surveillance.", "Report new symptoms promptly."],
            "red_flags": [],
        }
    loc_txt = {
        "submucosal":  "Submucosal location — highest AUB and fertility impact.",
        "intramural":  "Intramural — within myometrium, may distort cavity if >3cm.",
        "subserosal":  "Subserosal — pressure symptoms likely, lower menstrual impact.",
    }
    sev_txt = {
        "Minimal":  "Watchful waiting appropriate.",
        "Mild":     "Conservative medical management sufficient.",
        "Moderate": "Minimally invasive treatment should be considered.",
        "Severe":   "Surgical or interventional radiology consultation recommended.",
        "Critical": "Urgent surgical evaluation indicated.",
    }
    p3  = growth[2]["size_cm"]
    p12 = growth[11]["size_cm"]
    unc_note = (f" ⚠ High uncertainty (σ={uncertainty:.3f}) — repeat imaging advised."
                if uncertainty > 0.15 else "")
    summary = (
        f"{n_fibroids} fibroid(s) detected. "
        f"{loc_txt.get(location,'')} "
        f"Size class: {size}. "
        f"FSI {fsi}/100 ({sev}): {sev_txt.get(sev,'')} "
        f"Growth: ~{p3:.1f}cm at 3 months, ~{p12:.1f}cm at 12 months without treatment."
        + unc_note
    )
    urgency = ("Urgent" if sev in ("Critical","Severe") else
               "Soon (4-8 weeks)" if sev == "Moderate" else "Routine (3-6 months)")
    recs = []
    if sev in ("Minimal","Mild"):
        recs += ["6-monthly ultrasound surveillance.",
                 "Iron supplementation if heavy menstrual bleeding.",
                 "NSAIDs for dysmenorrhea management."]
    if sev == "Moderate":
        recs += ["GnRH agonist therapy to reduce fibroid size.",
                 "Consider uterine fibroid embolisation (UFE)."]
    if sev in ("Severe","Critical"):
        recs += ["Surgical consultation — myomectomy or hysterectomy.",
                 "Pre-operative MRI for complete uterine mapping.",
                 "Haematology review if anaemia present."]
    if location == "submucosal":
        recs.append("Hysteroscopic myomectomy — first-line for submucosal fibroids.")
    red_flags = []
    if location == "submucosal" and size in ("medium","large"):
        red_flags.append("Submucosal fibroid >3cm — high AUB and infertility risk")
    if texture == "heterogeneous" and size == "large":
        red_flags.append("Large heterogeneous fibroid — rule out leiomyosarcoma")
    if n_fibroids >= 3:
        red_flags.append(f"Multiple fibroids ({n_fibroids}) — increased symptom burden")
    return {"summary": summary, "urgency": urgency,
            "recommendations": recs[:5], "red_flags": red_flags}


# ══════════════════════════════════════════════════════════════════════════════
# RULE ENGINE (fallback — no models needed)
# ══════════════════════════════════════════════════════════════════════════════

def _rule_fibroid(img_bgr):
    """
    Fallback when trained models are not loaded yet.
    Returns 'No Fibroid' with a clear warning — image-statistics
    heuristics are NOT reliable for fibroid detection and must not
    be used for any clinical-style output.
    """
    clinical = {
        "summary": "No fibroid structures detected. Trained model files not yet loaded.",
        "urgency": "Routine",
        "recommendations": ["Add trained model files to backend/models/ to enable detection."],
        "red_flags": []
    }
    return {
        "detection":       "No Fibroid",
        "num_fibroids":    0,
        "size":            "none",
        "location":        "none",
        "texture":         "none",
        "detection_conf":  0.0,
        "size_conf":       0.0,
        "location_conf":   0.0,
        "texture_conf":    0.0,
        "uncertainty":     0.5,
        "fsi_score":       0,
        "fsi_severity":    "Minimal",
        "growth_12m":      [],
        "clinical":        clinical,
        "annotated_image": None,
        "gradcam_image":   None,
        "roi_image":       None,
        "model_used":      "rule_engine",
        "warning":         "Trained model files not loaded. Upload fibroid_yolo.pt, "
                           "fibroid_resnet.pt and fibroid_autoencoder.pt to backend/models/ "
                           "to enable real detection. Results shown are NOT valid.",
    }



# ══════════════════════════════════════════════════════════════════════════════
# YOLO-ONLY INFERENCE (YOLO loaded, ResNet not yet trained)
# Gives real "No Fibroid" / "Fibroid Detected" based purely on YOLO.
# Characterization (size/location/texture) shown as "Pending model training".
# ══════════════════════════════════════════════════════════════════════════════

def _yolo_only_fibroid(img_bgr):
    """Run detection with YOLO only. No characterization until ResNet trained."""
    import cv2
    import numpy as np

    # Run YOLO with strict confidence — only trust boxes ≥ 0.50
    yolo_res     = _yolo_model.predict(img_bgr, conf=0.50, iou=0.45, verbose=False)
    boxes        = yolo_res[0].boxes
    num_fibroids = len(boxes)

    # Annotated image
    annotated = yolo_res[0].plot()
    _, abuf   = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    annotated_b64 = base64.b64encode(abuf).decode()

    # Best box confidence
    best_conf = float(boxes.conf.cpu().numpy().max()) if num_fibroids > 0 else 0.0

    detection = "Fibroid Detected" if num_fibroids > 0 else "No Fibroid"

    # Crop ROI for display only
    roi_b64 = None
    if num_fibroids > 0:
        h, w = img_bgr.shape[:2]
        best_i = boxes.conf.cpu().numpy().argmax()
        xyxy   = boxes.xyxy[best_i].cpu().numpy().astype(int)
        x1, y1, x2, y2 = xyxy
        px = int((x2-x1)*0.25); py = int((y2-y1)*0.25)
        crop = img_bgr[max(0,y1-py):min(h,y2+py), max(0,x1-px):min(w,x2+px)]
        gray_crop = cv2.cvtColor(cv2.resize(crop, (224,224)), cv2.COLOR_BGR2GRAY)
        _, rbuf = cv2.imencode(".jpg", gray_crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
        roi_b64 = base64.b64encode(rbuf).decode()

    growth   = _simulate_growth("medium" if detection == "Fibroid Detected" else "small")
    fsi, sev = _compute_fsi(
        best_conf, "none", "none", "none", 0.3, num_fibroids
    )
    clinical = _clinical_reasoning(
        detection, "none", "none", "none",
        fsi, sev, num_fibroids, 0.3, growth
    )

    return {
        "detection":       detection,
        "num_fibroids":    num_fibroids,
        "size":            "none",
        "location":        "none",
        "texture":         "none",
        "detection_conf":  round(best_conf, 4),
        "size_conf":       0.0,
        "location_conf":   0.0,
        "texture_conf":    0.0,
        "uncertainty":     0.3,
        "fsi_score":       fsi,
        "fsi_severity":    sev,
        "growth_12m":      growth,
        "clinical":        clinical,
        "annotated_image": annotated_b64,
        "gradcam_image":   None,
        "roi_image":       roi_b64,
        "model_used":      "yolov8_only",
        "characterization_pending": True,
    }

# ══════════════════════════════════════════════════════════════════════════════
# MAIN ML INFERENCE
# ══════════════════════════════════════════════════════════════════════════════

def _ml_fibroid(img_bgr):
    import torch
    import torchvision.transforms as T
    import cv2
    import numpy as np
    from PIL import Image

    device = next(_resnet_model.parameters()).device
    h, w   = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # ── YOLO detection ────────────────────────────────────────────────────────
    yolo_res     = _yolo_model.predict(img_bgr, conf=0.50, iou=0.45, verbose=False)
    boxes        = yolo_res[0].boxes
    num_fibroids = len(boxes)

    annotated    = yolo_res[0].plot()
    _, abuf      = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    annotated_b64= base64.b64encode(abuf).decode()

    # ── Crop best ROI ─────────────────────────────────────────────────────────
    roi_b64 = None
    roi_bgr = None
    best_bbox_cm = None

    if num_fibroids > 0:
        best_i = boxes.conf.cpu().numpy().argmax()
        xyxy   = boxes.xyxy[best_i].cpu().numpy().astype(int)
        x1, y1, x2, y2 = xyxy
        px = int((x2-x1)*0.25); py = int((y2-y1)*0.25)
        rx1 = max(0,x1-px); ry1 = max(0,y1-py)
        rx2 = min(w,x2+px); ry2 = min(h,y2+py)
        roi_bgr = img_bgr[ry1:ry2, rx1:rx2]

        roi_gray_disp = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY)
        roi_disp = cv2.resize(roi_gray_disp, (224,224))
        _, rbuf  = cv2.imencode(".jpg", roi_disp, [cv2.IMWRITE_JPEG_QUALITY, 85])
        roi_b64  = base64.b64encode(rbuf).decode()

        est_w = (x2-x1)*0.03; est_h = (y2-y1)*0.03
        best_bbox_cm = (round(est_w,2), round(est_h,2))

    # ── ResNet50 + MC Dropout ─────────────────────────────────────────────────
    tf = T.Compose([
        T.Resize((224,224)), T.ToTensor(),
        T.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
    ])
    img_t  = tf(Image.fromarray(img_rgb))
    mc_out = _mc_predict(_resnet_model, img_t)

    det_cls  = mc_out["detection"]["pred_class"]
    det_conf = mc_out["detection"]["confidence"]
    siz_cls  = SIZE_CLASSES[mc_out["size"]["pred_class"]]
    loc_cls  = LOCATION_CLASSES[mc_out["location"]["pred_class"]]
    tex_cls  = TEXTURE_CLASSES[mc_out["texture"]["pred_class"]]
    unc      = mc_out["detection"]["uncertainty"]

    # Detection rule: YOLO MUST find at least 1 box for a positive result.
    # ResNet alone cannot trigger positive — untrained ResNet produces
    # random high-confidence outputs that are clinically meaningless.
    # Rule: YOLO box required + confidence >= 0.50.
    if num_fibroids > 0:
        detection = "Fibroid Detected"
    else:
        detection = "No Fibroid"
        num_fibroids = 0

    # If no fibroid detected, reset all characterization to none
    if detection == "No Fibroid":
        siz_cls = "none"
        loc_cls = "none"
        tex_cls = "none"
        best_bbox_cm = None

    # Override size from YOLO bbox if available (more accurate)
    if detection == "Fibroid Detected" and num_fibroids > 0 and best_bbox_cm:
        diam = (best_bbox_cm[0] + best_bbox_cm[1]) / 2
        siz_cls = "small" if diam < 3 else "medium" if diam < 6 else "large"

    # ── GradCAM on ROI ────────────────────────────────────────────────────────
    gradcam_b64 = None
    if detection == "Fibroid Detected" and roi_bgr is not None:
        gradcam_b64 = _run_gradcam(_resnet_model, roi_bgr)

    # ── FSI / Growth / Clinical — only meaningful when fibroid present ───────
    if detection == "No Fibroid":
        fsi, sev = 0, "Minimal"
        growth   = []
        clinical = {
            "summary": "No fibroid structures detected in this ultrasound image.",
            "urgency": "Routine",
            "recommendations": ["Continue routine gynaecological screening."],
            "red_flags": []
        }
    else:
        fsi, sev = _compute_fsi(det_conf, siz_cls, loc_cls, tex_cls, unc, num_fibroids)
        growth   = _simulate_growth(siz_cls if siz_cls != "none" else "small")
        clinical = _clinical_reasoning(detection, siz_cls, loc_cls, tex_cls,
                                        fsi, sev, num_fibroids, unc, growth)

    return {
        "detection":       detection,
        "num_fibroids":    num_fibroids,
        "size":            siz_cls,
        "location":        loc_cls,
        "texture":         tex_cls,
        "detection_conf":  round(det_conf, 4),
        "size_conf":       round(mc_out["size"]["confidence"], 4),
        "location_conf":   round(mc_out["location"]["confidence"], 4),
        "texture_conf":    round(mc_out["texture"]["confidence"], 4),
        "uncertainty":     round(unc, 4),
        "fsi_score":       fsi,
        "fsi_severity":    sev,
        "growth_12m":      growth,
        "clinical":        clinical,
        "annotated_image": annotated_b64,
        "gradcam_image":   gradcam_b64,
        "roi_image":       roi_b64,
        "model_used":      "yolov8m+efficientnetv2s+autoencoder",
    }


# ══════════════════════════════════════════════════════════════════════════════
# ROUTE
# ══════════════════════════════════════════════════════════════════════════════

@fibroid_bp.route("/predict/fibroid", methods=["POST"])
def predict_fibroid():
    import cv2
    import numpy as np

    file = request.files.get("image")
    if not file or file.filename == "":
        return jsonify({"error": "No image provided."}), 400

    allowed = {"image/jpeg","image/png","image/webp","image/bmp"}
    if (file.content_type or "") not in allowed:
        return jsonify({"error": "Unsupported file type. Upload JPEG or PNG."}), 400

    img_bytes = file.read()
    nparr     = np.frombuffer(img_bytes, np.uint8)
    img_bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return jsonify({"error": "Cannot decode image."}), 400

    full_ok = _load_models()   # tries ResNet + AE (also loads YOLO)
    yolo_ok = _yolo_loaded     # set by _load_models or _load_yolo

    try:
        if full_ok:
            # All 3 models loaded — full pipeline
            result = _ml_fibroid(img_bgr)
            result["models_loaded"] = True
        elif yolo_ok:
            # YOLO only — real detection, no characterization
            result = _yolo_only_fibroid(img_bgr)
            result["models_loaded"] = False
        else:
            # Nothing loaded — show setup instructions, no fake result
            result = _rule_fibroid(img_bgr)
            result["models_loaded"] = False
    except Exception as e:
        print(f"Fibroid inference error: {e}")
        result = _rule_fibroid(img_bgr)
        result["models_loaded"] = False
        result["warning"] = str(e)

    return jsonify(result)


@fibroid_bp.route("/models/fibroid/status", methods=["GET"])
def fibroid_status():
    ok = _load_models()
    return jsonify({
        "fibroid_yolo":    "loaded" if ok else "not_found",
        "fibroid_resnet":  "loaded" if ok else "not_found",
        "mode":            "ml" if ok else "rule_engine",
    })