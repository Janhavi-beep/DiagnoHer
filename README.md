# 🧠 DiagnoHer

### Automated Intelligent Diagnostic System for Fibroid Identification and Multi-Module AI Framework

---

<p align="center">
  <strong>AI-Powered Women's Healthcare Diagnostic Platform</strong>
</p>

<p align="center">
  Deep Learning • Medical Imaging • Explainable AI • Clinical Intelligence
</p>

---

# 📌 Overview

DiagnoHer is a **comprehensive AI-powered healthcare diagnostic platform** designed to assist in the **early detection, analysis, and management of women's reproductive health disorders** using medical imaging and clinical data.

The system combines:

* Deep Learning
* Machine Learning
* Explainable AI (XAI)
* Rule-Based Clinical Intelligence
* Medical Imaging Analysis
* Risk Prediction Systems

DiagnoHer aims to bridge the gap between **advanced AI technology and accessible healthcare diagnostics** by providing intelligent, interpretable, and scalable diagnostic assistance.

---

# 🎯 Objectives

* Develop an intelligent diagnostic system for gynecological disorders
* Integrate multiple AI models into a unified healthcare platform
* Provide explainable and interpretable diagnostic outputs
* Assist clinicians and patients with early-stage disease detection
* Build a scalable and modular medical AI framework
* Improve accessibility of AI-assisted reproductive healthcare
* Enable multi-modal diagnosis using imaging and clinical data

---

# 🚀 Core Features

## 🧬 AI Diagnostic Modules

### 🔹 PCOS Detection Module

* ResNet50-based ultrasound classification model
* YOLOv8 follicle detection and counting system
* Automated ovarian follicle visualization
* PCOS Risk Index (PRI) scoring
* Ultrasound image analysis pipeline
* Confidence score generation

### 🔹 Fibroid Detection Module

* YOLOv8m fibroid localization model
* EfficientNetV2-S classification system
* Autoencoder-based anomaly feature extraction
* Fibroid Severity Index (FSI) scoring
* Multi-head fibroid characterization:

  * Size
  * Location
  * Texture
* GradCAM++ visual explainability
* Monte Carlo Dropout uncertainty estimation

### 🔹 Ovarian Pathology Classification

* Multi-class CNN classification system
* 5-category ovarian pathology prediction
* Confidence distribution analysis
* Clinical interpretation support

### 🔹 Endometriosis Risk Prediction

* XGBoost-based risk scoring engine
* Symptom-based prediction model
* Multi-class severity assessment
* Clinical feature engineering pipeline

### 🔹 Menstrual Health Analysis

* Rule-based clinical decision engine
* Cycle regularity assessment
* Flow and pain severity analysis
* PCOS-linked irregularity detection
* Explainable scoring rules

---

# 💡 Additional Functionalities

* 🤖 AI Chat Assistant (LLaMA 3 via Groq API)
* 🧾 Smart Symptom Quiz Recommendation Engine
* 📊 Interactive Clinical Dashboard
* 📄 Automated Clinical Report Generation
* 🥗 Personalized Diet Recommendations
* 🏃 Exercise Recommendation Hub
* 🌗 Dark / Light Mode Support
* 📈 Live Model Statistics Dashboard
* 🧠 Explainable AI Visualizations
* 📋 Clinical Insight Generation

---

# 🏗️ System Architecture

## Workflow Pipeline

```text
User Input
   ↓
Diagnostic Module Selection
   ↓
Image / Symptom Data Upload
   ↓
Data Preprocessing
   ↓
AI Model Inference
   ↓
Confidence & Risk Analysis
   ↓
Explainability Engine (GradCAM)
   ↓
Clinical Interpretation
   ↓
Report Generation
```

---

# ⚙️ Tech Stack

## 🔹 Frontend

* React 18
* Vite
* Tailwind CSS
* Axios
* React Router

## 🔹 Backend

* Flask
* Python
* REST APIs

## 🔹 AI / ML Frameworks

* PyTorch
* Ultralytics YOLOv8
* EfficientNetV2 (timm)
* XGBoost
* OpenCV
* Scikit-learn
* Albumentations
* Grad-CAM

## 🔹 APIs & Integrations

* Groq API
* LLaMA 3.3 70B Versatile

---

# 🧠 AI Models Used

| Module                   | Model                          | Purpose                            |
| ------------------------ | ------------------------------ | ---------------------------------- |
| PCOS Detection           | ResNet50                       | PCOS Classification                |
| Follicle Detection       | YOLOv8n                        | Follicle Localization & Counting   |
| Fibroid Detection        | YOLOv8m                        | Fibroid Detection                  |
| Fibroid Classification   | EfficientNetV2-S + Autoencoder | Fibroid Characterization           |
| Ovarian Pathology        | ResNet50                       | Multi-Class Ovarian Classification |
| Endometriosis Prediction | XGBoost                        | Risk Prediction                    |
| Menstrual Health         | Rule-Based Engine              | Cycle Assessment                   |

---

# 📂 Project Structure

```text
DiagnoHer/
│
├── backend/
│   ├── app.py
│   ├── ml_engines.py
│   ├── fibroid_engine.py
│   ├── menstrual_engine.py
│   ├── models/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   └── package.json
│
├── datasets/
├── trained_models/
├── reports/
└── README.md
```

---

# 📦 Installation & Setup

## 🔹 Clone the Repository

```bash
git clone https://github.com/Janhavi-beep/DiagnoHer.git
```

## 🔹 Navigate to Project Directory

```bash
cd DiagnoHer
```

---

# ⚙️ Backend Setup

## 🔹 Create Virtual Environment

```bash
cd backend
python -m venv pcos_env
```

## 🔹 Activate Virtual Environment

### Windows

```bash
pcos_env\Scripts\activate
```

### Linux / macOS

```bash
source pcos_env/bin/activate
```

## 🔹 Install Dependencies

```bash
pip install -r requirements.txt
```

## 🔹 Run Flask Backend

```bash
python app.py
```

### Backend Server

```text
http://localhost:5000
```

---

# 🎨 Frontend Setup

## 🔹 Navigate to Frontend

```bash
cd frontend
```

## 🔹 Install Frontend Dependencies

```bash
npm install
```

## 🔹 Start Frontend Development Server

```bash
npm run dev
```

### Frontend Server

```text
http://localhost:5173
```

---

# 🧪 How to Use

## Step 1 — Open the Frontend

Open the frontend application in your browser:

```text
http://localhost:5173
```

## Step 2 — Select Diagnostic Module

Choose any module:

* PCOS Detection
* Fibroid Detection
* Ovarian Pathology
* Endometriosis Risk
* Menstrual Health

## Step 3 — Upload Data

* Upload ultrasound image
* OR enter clinical symptoms

## Step 4 — AI Analysis

The system performs:

* Image preprocessing
* Model inference
* Risk scoring
* Explainability analysis
* Clinical interpretation

## Step 5 — View Results

View:

* Prediction results
* Confidence scores
* AI explanations
* GradCAM heatmaps
* Clinical insights
* Severity scores
* Recommendations

---

# 📊 Model Performance

| Model                        | Accuracy / Metric |
| ---------------------------- | ----------------- |
| PCOS ResNet50                | 94.2%             |
| YOLOv8n Follicle Detector    | 89.5%             |
| Ovarian Pathology ResNet50   | 91.7%             |
| Endometriosis XGBoost        | 88.6%             |
| YOLOv8m Fibroid Detector     | mAP50 98.9%       |
| EfficientNetV2-S + AE Fusion | 98.5% Avg         |
| Fibroid Detection            | 98%+              |

---

# 🔍 Fibroid Module Performance

| Task                    | Accuracy |
| ----------------------- | -------- |
| Detection               | 100.0%   |
| Size Classification     | 98.0%    |
| Location Classification | 98.5%    |
| Texture Classification  | 97.4%    |

---

# 📈 Platform Statistics

* Total AI Models Deployed: **7**
* Average Model Accuracy: **93.3%**
* Average AUC: **0.951**
* Multiple Dataset Integrations
* Explainable AI Enabled
* Real-Time Prediction Pipeline

---

# 🔬 Explainable AI Features

DiagnoHer integrates Explainable AI (XAI) systems to improve transparency and interpretability.

## Included XAI Techniques

* GradCAM++
* Score-CAM
* Confidence Visualization
* Attention Highlighting
* Region-Based Localization
* Uncertainty Estimation

These systems help users and clinicians understand:

* Why the model made a prediction
* Which regions influenced the decision
* Prediction confidence and uncertainty

---

# 🧪 Datasets Used

## PCOS

* PCOS XAI Ultrasound Dataset

## Fibroid

* Mendeley Uterine Fibroid Ultrasound Dataset
* Pelvic Ultrasound Dataset

## Ovarian Pathology

* Ovarian Ultrasound Image Dataset

## Endometriosis

* Clinically grounded synthetic dataset

---

# 🧠 Key Innovations

* Multi-model AI fusion architecture
* Explainable AI using GradCAM++
* Hybrid AI + Rule-Based clinical system
* Real-time diagnostic predictions
* Clinical scoring systems:

  * FSI (Fibroid Severity Index)
  * PRI (PCOS Risk Index)
* Monte Carlo Dropout uncertainty estimation
* Multi-task medical imaging framework
* Symptom + Imaging integrated analysis

---

# 📋 Clinical Features

* Confidence score reporting
* Severity categorization
* Clinical interpretation engine
* Risk prediction models
* Automated recommendations
* Explainable diagnostic output
* Guideline-inspired logic
* Cross-module correlation analysis

---

# 🌐 Supported Modules

| Module             | Input Type          |
| ------------------ | ------------------- |
| PCOS Detection     | Ultrasound Images   |
| Fibroid Detection  | Ultrasound Images   |
| Ovarian Pathology  | Ultrasound Images   |
| Endometriosis Risk | Clinical Symptoms   |
| Menstrual Health   | Clinical Parameters |

---

# 🔮 Future Scope

* Mobile application development
* Cloud deployment (AWS / GCP)
* Integration with hospital systems
* Additional disease modules
* Real-time clinical decision support
* EHR integration
* Multi-language support
* AI-assisted telemedicine support
* Advanced explainability dashboards

---

# 🎥 Project Demo Video

[Watch Demo Video](https://drive.google.com/file/d/1ymcjhmdUOgwSFg8Q3kY05Ll8yfQSETKC/view?usp=sharing)

---

# 🖼️ UI Highlights

* Modern medical dashboard UI
* Responsive frontend design
* Dark / Light mode support
* Interactive analytics
* Real-time predictions
* Clinical visualizations
* Professional healthcare styling

---

# 🔐 Disclaimer

This project is intended for:

* Educational purposes
* Research purposes
* AI healthcare experimentation

DiagnoHer should **NOT** be used as a substitute for professional medical diagnosis, treatment, or clinical decision-making.

Always consult qualified healthcare professionals for medical advice.

---

# 👩‍💻 Author

## Janhavi Deshmukh
## Shreeya Bhalwatkar
## Sharvari Chambavane

Final Year Engineering Project

---


# 📬 Repository

## GitHub Repository

```text
https://github.com/Janhavi-beep/DiagnoHer
```

---

# 💙 DiagnoHer

### Empowering Women's Healthcare Through AI
