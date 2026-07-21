# 🏭 SamiQ — Industrial AI Workspace & Knowledge Engine

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)

SamiQ is an enterprise-grade **Industrial AI Workspace & RAG Knowledge Engine** designed for plant engineering, maintenance teams, safety compliance officers, and industrial operators. It unifies technical manuals, standard operating procedures (SOPs), equipment schematics, and live asset telemetry into an interactive, AI-assisted platform.

---

## 🌟 Key Features

### 🧠 1. RAG-Powered AI Copilot & Smart Search
- **Retrieval-Augmented Generation (RAG)**: Ask technical troubleshooting questions (e.g., *"What is the Governor valve calibration procedure for Turbine T-202?"*) and receive contextual answers powered by vector document retrieval.
- **Multi-Format Text Ingestion**: Parses digital PDFs, scanned documents, Word files (`.docx`), plain text manuals (`.txt`), and schematics (`.png`).
- **Interactive Citation Drawer**: Each answer includes direct file URL citations, section links, and exact excerpt previews.

### 🕸️ 2. Dynamic Industrial Knowledge Graph
- **Interactive D3 Force Network**: Visualizes relationships between plant departments (`Operations`, `Maintenance`, `Safety`), registered equipment assets, uploaded manuals, and user audit timelines.
- **Physics Simulation & Filtering**: Built with collision bounds and drag constraints to prevent node overlap. Filter by entity layers (`Assets`, `Documents`, `Members`, `Logs`).
- **Inspector Side-Drawer**: Click any graph node to inspect metadata, uploader info, equipment tags, and linked manuals.

### ⚙️ 3. Asset Management & Telemetry Alarms
- **Equipment Inventory**: Track centrifugal pumps (P-101), steam turbines (T-202), compressors (C-303), heat exchangers (E-404), and control valves (V-505).
- **Live Anomaly Feed & Health Metrics**: Real-time status indicators, alarm thresholds (e.g., *Bearing Temp > 80°C*), and maintenance history.

### 👥 4. Enterprise Member Management & RBAC
- **Role-Based Access Control**: Separate privileges for **Workspace Administrators** and **Operators/Employees**.
- **CSV Batch Import**: Bulk import workspace team members with interactive column mapping, validation, and error detection.
- **Profile Customization**: Precise profile avatar cropping with interactive zoom/pan controls.

### 🔒 5. Workspace Administration & Audit Trails
- **Audit Logging**: Comprehensive event tracking for document ingestion, deletions, Copilot queries, and member management.
- **Global Toast Notification System**: Animated, non-intrusive sky blue popups for real-time operation confirmation.
- **Theme Preferences**: Seamless Light and Dark mode switching across all views.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom industrial design tokens
- **Visualization**: D3.js (Force-Directed Graphing)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database Layer**: MongoDB / Mongoose (with automated local JSON DB fallback)
- **AI Integration**: Google Generative AI (Gemini / RAG Embeddings)
- **File Parsing**: `pdf-parse`, Multer, XML DOM Parser for DOCX

---

## 📁 Current Repository Structure

```
AI-Industry/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API Controllers (auth, docs, assets, copilot, graph, members)
│   │   ├── middleware/       # JWT Auth & RBAC Middleware
│   │   ├── models/           # Mongoose Schemas (User, Asset, Document, Chunk, ActivityLog)
│   │   ├── repositories/     # Repository Pattern interfaces & Mongoose/JSON implementations
│   │   ├── services/         # Document Parser & Semantic RAG Search Services
│   │   ├── utils/            # DB Connection & Helper Utilities
│   │   └── server.ts         # Express Application Entry Point
│   ├── .env.example          # Backend Environment Template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/               # Favicons, Logos, Avatars & Landing Page Assets
│   ├── src/
│   │   ├── components/       # Reusable UI (Sidebar, Toast, Modals)
│   │   ├── context/          # React Context (AuthContext, ThemeContext, ToastContext)
│   │   ├── pages/            # Page Views (Dashboard, Documents, Copilot, Graph, Assets, Profile, Members)
│   │   ├── utils/            # API Client Fetch Utility
│   │   ├── App.tsx           # Router & App Layout Configuration
│   │   ├── main.tsx          # React Root Entry Point
│   │   └── index.css         # Global Styles & Animations
│   ├── .env.example          # Frontend Environment Template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore                # Root Git Ignore Configuration
└── README.md                 # Project Documentation
```

---

## 🚀 Quick Start & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone Repository
```bash
git clone https://github.com/Akshikmt/AI-Industry.git
cd AI-Industry
```

### 2. Backend Configuration & Launch
```bash
cd backend
npm install
```

Copy environment template:
```bash
cp .env.example .env
```
*(Configure `PORT`, `JWT_SECRET`, `MONGODB_URI`, and `GEMINI_API_KEY` in `.env`)*

Start Backend Server:
```bash
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

### 3. Frontend Configuration & Launch
Open a new terminal window:
```bash
cd frontend
npm install
```

Copy environment template:
```bash
cp .env.example .env
```

Start Development Server:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🔒 Security & Best Practices

- **Zero Secret Exposure**: `.env` files, `node_modules/`, and temporary upload binaries are strictly ignored via `.gitignore`.
- **JWT Session Security**: Secure authorization headers for restricted API endpoints.
- **Enterprise Audit Trail**: Immutable action logging for compliance and security review.

---

## 📄 License

Distributed under the **MIT License**.
