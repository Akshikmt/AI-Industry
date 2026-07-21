# 🏢 SamiQ — Universal AI Workspace & Knowledge Engine

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)

SamiQ is an enterprise-grade **Universal AI Workspace & RAG Knowledge Engine** adaptable to any industry (manufacturing, energy, healthcare, IT, logistics, financial services, construction, and corporate enterprises). It unifies organizational documents, standard operating procedures (SOPs), policy manuals, technical schematics, and asset/system inventories into an interactive, AI-assisted platform.

---

## 🌟 Key Features

### 🧠 1. RAG-Powered AI Copilot & Smart Search
- **Retrieval-Augmented Generation (RAG)**: Query any uploaded organization documents (e.g., standard operating procedures, compliance guidelines, policy manuals, technical documentation) and receive instant, contextual answers powered by vector document retrieval.
- **Multi-Format Document Parsing**: Ingests digital PDFs, scanned documents, Word files (`.docx`), plain text files (`.txt`), and technical diagrams/images (`.png`, `.jpg`).
- **Interactive Citation Drawer**: Every generated response includes direct document citations, section links, and exact excerpt previews.

### 🕸️ 2. Dynamic Organizational Knowledge Graph
- **Interactive D3 Force Network**: Visualizes relationships between organizational departments, registered assets/systems, uploaded documents, and user activity timelines.
- **Physics Simulation & Layer Filtering**: Built with collision bounds and drag constraints to prevent node overlap. Filter by entity layers (`Assets/Systems`, `Documents`, `Members`, `Logs`).
- **Inspector Side-Drawer**: Click any graph node to inspect metadata, uploader details, system tags, and linked documents.

### ⚙️ 3. Asset & System Inventory Management
- **Catalog Inventory**: Track organizational assets, equipment, machinery, hardware, or facility systems across departments.
- **Status Indicators & Health Metrics**: Monitor asset operational states, maintenance history, and telemetry logs.

### 👥 4. Enterprise Member Management & RBAC
- **Role-Based Access Control**: Granular access control for **Workspace Administrators** and **Team Members/Operators**.
- **CSV Batch Import**: Bulk import organization team members with interactive column mapping, validation, and error detection.
- **Profile Customization**: Precise profile avatar cropping with interactive zoom/pan controls.

### 🔒 5. Workspace Administration & Audit Trails
- **Audit Logging**: Immutable event tracking for document ingestion, deletions, Copilot queries, and member profile updates.
- **Global Toast Notification System**: Animated, non-intrusive popups for real-time operation confirmation.
- **Theme Preferences**: Seamless Light and Dark mode switching across all workspace views.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme design system
- **Visualization**: D3.js (Force-Directed Graphing)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database Layer**: MongoDB / Mongoose (with automated local JSON DB fallback for local offline execution)
- **AI Integration**: Google Generative AI (Gemini / RAG Embeddings)
- **File Parsing**: `pdf-parse`, Multer, XML DOM Parser for DOCX

---

## 📁 Repository Structure

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
