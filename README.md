# Deeplyn-website

<div align="center">
#Deeplyn
 
**A wellness platform designed for people with borderline personality disorder(BPD) with AI-powered emotion classification**
 
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django_REST_Framework-green?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace-XLM--RoBERTa-yellow?logo=huggingface&logoColor=black)
</div>
---
 
## About
 
**Deeplyn** is a full-stack emotional wellness web application developed as my **Bachelor's Thesis**, designed to support people with borderline personality disorder and anyone interested in better understanding and managing their emotions - [Faculty of Computer Science, Alexandru Ioan Cuza University](https://www.info.uaic.ro/) (FII UAIC), Iași, Romania.
 
The platform connects **patients** with **therapists** in a structured environment grounded in Dialectical Behavior Therapy (DBT) and Cognitive Behavioral Therapy (CBT) principles. At its core sits a machine learning pipeline for **real-time, multi-label emotion classification** - allowing both sides to track emotional states over time, identify patterns, and measure progress in a clinically structured way.
 
Built from the ground up: custom DRF backend, React frontend, and a fine-tuned transformer model trained on a composite multilingual dataset.
 
---
 
## Features
 
### Authentication & Roles

- The platform supports two distinct user types - **patients** and **therapists** - each with a dedicated registration flow and a different set of permissions throughout the app.
- Sessions are managed through JWT tokens stored in HttpOnly cookies, meaning authentication state is never exposed to JavaScript and is protected against CSRF attacks by default.
- Newly registered therapists go through a manual approval step before gaining access. Accounts remain pending until an administrator reviews and approves them.

### Therapist–patient Relationship

- patients can browse a therapist directory and send a connection request to whichever therapist they choose. The therapist decides whether to accept or decline.
- Therapists can toggle their availability - when they're not accepting new patients, their profile is closed to incoming requests.
- When a therapeutic relationship ends, the platform automatically cleans up all shared data: notes that were made visible to the other party revert to private, and any sessions tied to that relationship are removed. Nothing carries over between relationships.

### Session Management

- Therapists initiate session proposals; patients receive them and choose to confirm or decline. No session is ever created without explicit consent from both parties.
- Every status change in the flow - proposal, approval, rejection - triggers an email notification so neither party misses an update.

### Exercises

- Therapists can assign both platform-provided DBT/CBT exercises and ones they build themselves, giving them flexibility to tailor the therapeutic plan.
- Removing an exercise hides it from the interface without deleting the underlying data, so historical completion records stay intact.
- Exercises that require answers across multiple fields merge all responses into one before submission, keeping the data model clean on the backend.

### Quizzes

- The quiz engine tracks which questions a patient has already been asked and avoids repeating them, ensuring variety across sessions.
- patients can choose to share individual answers with their therapist rather than sharing everything or nothing - answer-level granularity.
- Therapists can set a deadline for quiz completion, and each question is labeled with its source so patients know where the content comes from.

### Dashboard & Emotion Statistics

- The dashboard tracks how consistently a patient logs their emotions and displays a running streak to encourage regular engagement.
- Emotion percentages are calculated using the largest remainder method, which guarantees the displayed values always add up to exactly 100% with no floating-point drift.
- Both patients and therapists can view how emotional patterns shift over time through historical trend data.

### Emotion Classification (ML)

- Every time a patient submits a text entry, the platform automatically identifies which emotions are present - not just the dominant one, but all that apply simultaneously.
- The model handles multiple languages without any additional setup, which makes the platform accessible to users regardless of the language they write in.
- Classification runs in real time: the result is returned through a dedicated API endpoint and immediately reflected in the patient's emotion history.

### UI/UX

- The entire interface follows a unified purple color palette, from backgrounds to interactive elements, giving the app a consistent and calm visual identity.
- The landing page features a custom-designed cursor that replaces the browser default, creating a distinctive first impression.
- The layout adapts to any screen size using Tailwind CSS utility classes with no custom breakpoint logic needed.
- All icons across the app are normalized to the same visual weight regardless of size, so the interface looks consistent even when icons appear at different scales.
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| **Backend** | Django 5.2.13 + Django REST Framework |
| **Frontend** | React 18 + Tailwind CSS |
| **Authentication** | SimpleJWT - HttpOnly cookies |
| **Database** | SQLite (development) |
| **ML Model** | XLM-RoBERTa Base - fine-tuned via HuggingFace Transformers and Kaggle|
| **Dataset** | [`nadiaenzet26/deeplyn-emotions-v4`](https://huggingface.co/datasets/nadiaenzet26/deeplyn-emotions-v4) |
| **NLP Libraries** | HuggingFace `transformers` + `datasets` |
 
---
 
## ML Model - Emotion Classification
 
The core ML component is a **fine-tuned XLM-RoBERTa Base** model for **19-class multi-label emotion classification**.
 
### Performance
 
| Metric | Value |
|---|---|
| Macro ROC-AUC | **0.992** |
| Task | Multi-label classification |
| Emotion classes | 19 |
| Base architecture | XLM-RoBERTa Base |
 
### Training Dataset
 
The model was trained on a composite dataset (`nadiaenzet26/deeplyn-emotions-v4`) assembled from five public sources, rebalanced to approximately **5,000 examples per class** after deduplication.
 
| Dataset | Authors / Source | Link | Notes |
|---|---|---|---|
| **ISEAR** | Scherer & Wallbott | [CISA - UNIGE](https://huggingface.co/datasets/savalera/isear-from-original) | Survey-based; 7 core emotion categories |
| **EmpatheticDialogues** | Rashkin et al., Facebook Research (2019) | [HuggingFace](https://huggingface.co/datasets/Bdotloh/empatheticdialogues-contexts) | Dialogue-grounded; 32 fine-grained emotion labels |
| **CARER (dair-ai/emotion)** | Saravia et al. | [HuggingFace](https://huggingface.co/datasets/dair-ai/emotion) | Twitter-sourced; 6–8 emotion labels |
| **GoEmotions** | Demszky et al., Google Research (2020) | [HuggingFace](https://huggingface.co/SamLowe/roberta-base-go_emotions) | Reddit comments; 27 fine-grained labels - used specifically for **neutral** examples |
| **Synthetic dataset** | HuggingFace community contributors | [HuggingFace Hub](https://huggingface.co/) | Augmentation source; disclosed as a known dataset limitation |
 
---
 
## Demo
 
[demo](https://youtu.be/EdDpEnSprMY) 

---
 
## How to Run
 
### Backend (Django REST Framework)
 
```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/deeplyn.git
cd deeplyn/backend
 
# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate 
# Windows: venv\Scripts\activate
 
# 3. Install dependencies
pip install -r requirements.txt
 
# 4. Apply migrations
python manage.py migrate
 
# 5. (Optional) Create a superuser
python manage.py createsuperuser
 
# 6. Start the development server
python manage.py runserver
```
 
> The backend runs at `http://localhost:8000`.
 
---
 
### Frontend (React + Tailwind CSS)
 
```bash
cd deeplyn/frontend
 
# 1. Install dependencies
npm install
 
# 2. Start the development server
npm run dev
```
 
> The frontend runs at `http://localhost:5173`.
 
---
 
### ML Model (HuggingFace)
 
Load the fine-tuned model directly from HuggingFace Hub:
 
```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
 
tokenizer = AutoTokenizer.from_pretrained("nadiaenzet26/deeplyn-emotions-v4")
model = AutoModelForSequenceClassification.from_pretrained("nadiaenzet26/deeplyn-emotions-v4")
```
 
Or load the training dataset:
 
```python
from datasets import load_dataset
 
ds = load_dataset("nadiaenzet26/deeplyn-emotions-v4")
```
 
---
 
 
## Academic Context
 
This project was developed as a bachelor's thesis at the **Faculty of Computer Science, Alexandru Ioan Cuza University**, Iași, Romania (FII UAIC), academic year 2025–2026.
 
**Author:** Nadia-Ioana Zapodeanu 
**Institution:** FII UAIC - Iași, Romania  
**Year:** 2026
 
---
 
<div align="center">
  Made with 💜 by <a href="https://github.com/NadiaZapodeanuNZ">Nadia</a> · FII UAIC · 2026
</div>