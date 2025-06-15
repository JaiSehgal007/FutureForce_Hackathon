# 🔐 Fraud Detection in Financial Systems — FutureForce AI Hackathon (Salesforce)

A full-stack fraud detection solution built to monitor and flag suspicious activities in financial systems using **Machine Learning**, **Generative AI**, and **LLM-based agentic reasoning**. The project includes three types of clients (Bank User, Bank Employee, Admin) with an integrated dashboard and chatbot for real-time fraud monitoring and insights.

---

## 🚀 Features

- **Multi-role access**: Bank User, Employee, and Admin logins
- **Fraud Detection Pipeline**:
  - **30%** risk score from ML ensemble: K-Means, Autoencoders, Isolation Forest, and XGBoost
  - **40%** risk score from transaction anomaly detection (spike in transaction amount/time)
  - **30%** risk score using **Einstein AI** for generative predictions based on geolocation & timestamps
- **Chatbot Interface**:
  - FAQ retrieval via **Pinecone** + **Sentence Transformers**
  - Admin-only agentic query interface powered by **LangGraph** and **Einstein AI**
- **Behavior Monitoring**:
  - Track employees/admins accessing sensitive data or granting abnormal permissions
  - Detect unusual login or transaction behavior of bank users

---

## 🧠 AI Models Used

- **Unsupervised**: K-Means, Autoencoders, Isolation Forest
- **Supervised**: XGBoost
- **Generative AI**: Einstein GPT-4.0 mini
- **Semantic Search**: Sentence Transformers (`all-MiniLM-L6-v2`), Pinecone
- **LangGraph Agentic Framework** for Admin chatbot

---

## 📦 Project Structure
```
root/
│
├── frontend/               # ReactJS Frontend
│
├── node-backend/          # NodeJS + Express backend
│
├── python-backend/        # FastAPI backend for fraud detection
│   ├── main.py            # Serves client & employee fraud score queries
│   └── einstein_graph.py  # Admin-facing LangGraph agent server
│
├── models/                # Trained ML models
├── datasets/              # Kaggle-sourced datasets
├── embeddings/            # FAQ embeddings and Pinecone integration
├── README.md              # You're here!
```

## 🛠️ Setup & Installation

### 1. Frontend (ReactJS)
```bash
cd frontend
npm install
npm run dev
```

### 2. Node Backend (ExpressJS)
```bash
cd node-backend
npm install
npm run dev
```

### 3. Python Backend (FastAPI)
```bash
cd python-backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Run the backend for client & employee
python main.py

# Run the admin backend via Einstein Graph
python einstein_graph.py
```

## 🔐 Environment Setup

### ✅ Python Backend (.env file)
```
COURSE_API_KEY=***************
FAQ_API_KEY=***************
SPEECH_KEY=***************
SPEECH_REGION=centr
SPEECH_LANGUAGE=English
AZURE_OPENAI_ENDPOINT=https://***************
STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=***************
LANGUAGE_KEY=***************
LANGUAGE_ENDPOINT=https://***************

EINSTEIN_CLIENT_ID=***************
EINSTEIN_CLIENT_SECRET=***************
EINSTEIN_TOKEN_URL=https://orgfarm-72/token
EINSTEIN_API_URL=https://api.sa
```

### ✅ Node Backend (.env file)
```
MONGO_DB_URL=mongodb+srv://***************
CORS_ORIGIN=http://localhost:3001
PYTHON_API_URL=https://***************
PORT=5000

ACCESS_TOKEN_SECRET=***************
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=***************
REFRESH_TOKEN_EXPIRY=7d
```

🔒 **Ensure that all secret keys are encoded and stored securely. Add .env to your .gitignore.**

## 🛡️ Admin Capabilities
Admins can:
- View flagged transactions from clients and employees
- Block access to suspicious accounts
- Create new employee accounts
- Access statistics and reports for fraud activities by region
- Query fraud logs and trends through a chatbot interface powered by LangGraph + Einstein AI

## 💬 Chatbot Functionality
- **Clients/Employees**: Ask general banking-related FAQs, answered using vector search (Pinecone + Sentence Transformers)
- **Admin**: Run analytics queries, trigger fraud investigations, fetch transaction summaries

**Powered by**:
- Sentence Transformers (all-MiniLM-L6-v2)
- Einstein GPT (4.0 mini)
- LangGraph with agentic workflows

## 🌍 Technologies Used
| Category              | Tools/Frameworks                                      |
|-----------------------|-------------------------------------------------------|
| Frontend              | ReactJS                                               |
| Backend               | NodeJS + Express, Python + FastAPI                    |
| Machine Learning      | Scikit-learn, XGBoost, Autoencoders                   |
| Generative AI         | Salesforce Einstein AI (GPT-4.0 mini)                 |
| Agentic Architecture  | LangGraph + LLM nodes                                 |
| Embeddings + Search   | Hugging Face Sentence Transformers + Pinecone         |
| Auth + Security       | JWT, Role-based Access Control (RBAC)                 |

## 📊 Dataset
We used publicly available datasets from Kaggle for:
- Labeled transaction data (for XGBoost)
- Unlabeled transaction patterns (for unsupervised models)
- User behavior and fraud flags
- FAQ knowledge base

## 🔮 Future Improvements
- Integrate user & employee behavioral tracking:
  - Flag admins granting too many permissions or accessing sensitive endpoints frequently
  - Detect users with inconsistent or erratic transaction patterns
- Real-time fraud detection using Kafka and WebSockets
- Incorporate CI/CD retraining pipelines with new data
- Add multi-language support for chatbot via Azure + Hugging Face
- Mobile app frontend (React Native / Flutter)

## 📸 Screenshots
<div align="center">
  <img src="frontend/src/images/Screenshot 2025-06-12 173333.png" alt="Project Screenshot" width="600" height="auto">
</div>
<div align="center">
  <img src="frontend/src/images/Screenshot 2025-06-12 173429.png" alt="Project Screenshot" width="600" height="auto">
</div>
<div align="center">
  <img src="frontend/src/images/Screenshot 2025-06-12 173501.png" alt="Project Screenshot" width="600" height="auto">
</div>
<div align="center">
  <img src="frontend/src/images/Screenshot 2025-06-12 173509.png" alt="Project Screenshot" width="600" height="auto">
</div>

## 👥 Team
Built with ❤️ during the FutureForce AI Hackathon by Jai Sehgal, Kushagra Gupta, Pramodha Kasam, Sudhanshu Gurupanch

