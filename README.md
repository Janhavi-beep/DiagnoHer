# 🧠 DiagnoHer  
### Automated Intelligent Diagnostic System for Fibroid Identification and Multi-Module AI Framework

---

## 📌 Overview

DiagnoHer is a **comprehensive AI-powered healthcare diagnostic platform** designed to assist in the **early detection, analysis, and management of women's reproductive health disorders** using medical imaging and clinical data.

The system leverages **deep learning, machine learning, and rule-based clinical intelligence** to provide:
- Accurate disease detection  
- Risk prediction  
- Clinical insights  
- Explainable AI outputs  

This project aims to bridge the gap between **AI technology and accessible healthcare diagnostics**.

---

## 🎯 Objectives

- Develop an intelligent diagnostic system for gynecological disorders  
- Integrate multiple AI models into a unified platform  
- Provide explainable and interpretable results  
- Assist clinicians and patients with early-stage detection  
- Build a scalable and modular healthcare AI framework  

---

## 🚀 Features

### 🧬 AI Modules

#### 🔹 PCOS Detection
- ResNet50-based classification model  
- YOLOv8 for follicle detection  
- Ultrasound image analysis  

#### 🔹 Fibroid Detection
- YOLOv8 object detection  
- EfficientNetV2-S classification  
- Autoencoder for anomaly detection  
- GradCAM for visual explainability  

#### 🔹 Ovarian Pathology Classification
- Multi-class CNN model  
- Classifies ovarian conditions into 5 categories  

#### 🔹 Endometriosis Risk Prediction
- XGBoost machine learning model  
- Based on patient symptoms and clinical data  

#### 🔹 Menstrual Health Analysis
- Rule-based system using clinical parameters  
- Provides cycle tracking insights  

---

### 💡 Additional Functionalities

- 🤖 AI Chat Assistant (LLaMA 3 via Groq API)  
- 🧾 Smart Symptom Quiz (module recommendation system)  
- 📊 Interactive Dashboard with analytics  
- 📄 Automated Clinical Report Generation  
- 🥗 Personalized Diet & Exercise Recommendations  

---

## 🏗️ System Workflow

1. User selects a diagnostic module  
2. Inputs data (image or symptoms)  
3. Data preprocessing is performed  
4. AI model processes input  
5. Results are generated with confidence scores  
6. Explainability module (GradCAM) highlights regions  
7. Final report is generated  

---

## ⚙️ Tech Stack

### 🔹 Frontend
- React (Vite)  
- Tailwind CSS  
- Axios  

### 🔹 Backend
- Flask (Python)  
- REST APIs  

### 🔹 AI / ML
- PyTorch  
- Ultralytics YOLOv8  
- EfficientNetV2 (timm)  
- XGBoost  
- OpenCV  
- Scikit-learn  

---


## ▶️ How to Run the Project

### 🔹 1. Clone Repository
```bash
git clone https://github.com/Janhavi-beep/DiagnoHer.git
cd DiagnoHer


🔹 2. Backend Setup
cd backend
python -m venv pcos_env
pcos_env\Scripts\activate    # Windows

pip install -r requirements.txt
python app.py

Backend runs at:
http://localhost:5000

🔹 3. Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs at:
http://localhost:5173


🧪 How to Use
Open the frontend in browser
Select a module:
PCOS
Fibroid
Ovarian
Endometriosis
Menstrual
Upload ultrasound image or enter symptoms
View:
Prediction results
Confidence scores
AI explanations
Clinical insights



📊 Model Performance
Model	Accuracy
PCOS ResNet50	94.2%
Ovarian Model	91.7%
Endometriosis XGBoost	88.6%
Fibroid Detection	98%+


🔍 Key Innovations
Multi-model AI fusion architecture
Explainable AI using GradCAM
Hybrid system (AI + Rule-based logic)
Real-time diagnostic predictions
Clinical scoring systems (FSI, PRI)


🔮 Future Scope
Mobile application development
Cloud deployment (AWS / GCP)
Integration with hospital systems
Expansion to additional diseases
Real-time clinical decision support


## Project Demo Video

[Watch Demo Video](https://drive.google.com/file/d/1ymcjhmdUOgwSFg8Q3kY05Ll8yfQSETKC/view?usp=sharing)

## ⚠️ Disclaimer

This project is intended for educational and research purposes only and should not be used as a substitute for professional medical diagnosis.

## 👩‍💻 Author

Janhavi Deshmukh
Final Year Engineering Project

