# 🛡️ Real-Time Network Defense Security System (NDSS)

A full-stack, real-time **Network Intrusion Detection & Defense Dashboard** built with **FastAPI** (backend) and **React + Vite + Tailwind CSS** (frontend). The system monitors live network traffic, detects threats using a 2/3 voting mechanism, and provides a beautiful Ocean Blue UI with manual packet analysis.

---

## ✨ Features

- **⚡ Real-Time WebSocket Monitoring** — Live traffic metrics streamed from the backend every second
- **🗳️ 2/3 Voting Classifier** — Evaluates Packet Size, Packet Count, and Entropy against thresholds; a threat is declared when 2 of 3 vote malicious
- **📊 Live Recharts Graphs** — Real-time line charts for Packets/Sec and Entropy
- **🔍 Deep Packet Inspection Stream** — Scrollable live log of every packet analyzed
- **🧪 Manual Packet Analysis** — Enter custom values and get a full Analysis Report on a dedicated results page
- **🚨 Active Mitigation Panel** — Tracks auto-blocked IPs and scrubbed packet counts
- **🌊 Ocean Blue Theme** — Premium dark UI with emerald/amber/red semantic status colors
- **📱 Responsive Design** — Works on desktop and mobile

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.9+, FastAPI, Uvicorn, Scikit-learn, WebSockets |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, React Router DOM |

---

## 🚀 Setup & Running Locally

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**

### 1. Backend (FastAPI)

```bash
# From the project root (Real-Time-NDSS/)
python -m venv venv

# Activate — Windows:
venv\Scripts\activate
# Activate — Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`  
WebSocket endpoint: `ws://localhost:8000/ws`  
Manual Analysis API: `POST http://localhost:8000/api/test`

### 2. Frontend (React/Vite)

Open a **new terminal** in the `frontend/` directory:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Dashboard available at: `http://localhost:5173`

---

## 📂 Project Structure

```
Real-Time-NDSS/
├── main.py                  # FastAPI backend — WebSocket + /api/test endpoint
├── requirements.txt         # Python dependencies
├── .gitignore
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.tsx       # Main real-time dashboard
    │   │   └── AnalysisResult.tsx  # Manual analysis results page
    │   ├── App.tsx                 # React Router setup
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## 🎯 How the Voting Mechanism Works

| Malicious Votes | Classification | Action |
|----------------|---------------|--------|
| 0 / 3 | ✅ Safe | No action required |
| 1 / 3 | ⚠️ Suspicious | Active monitoring |
| 2–3 / 3 | 🚨 Malicious | Auto-block + scrub |

**Thresholds:**
- Packet Size > **1,000 KB** → 1 vote
- Packet Count > **15,000 PPS** → 1 vote  
- Entropy > **5.5 bits** → 1 vote

---

## 🔧 Configuration

The API URL is currently hardcoded to `localhost:8000`. For production deployment, update these in your environment:

- **WebSocket**: `ws://localhost:8000/ws` in `Dashboard.tsx`
- **API**: `http://localhost:8000/api/test` in `Dashboard.tsx`

---

## 📄 License

MIT
