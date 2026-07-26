# 🛡️ Adversarial Corporate Auditor

> **Enterprise Multi-Agent Corporate Audit & Strategic Risk Assessment System**  
> Powered by **LangGraph**, **LangChain**, **FastAPI**, **Neon PostgreSQL**, **React + Vite**, and **ReportLab PDF Generator**.

---

## 🏛️ Executive Overview

**Adversarial Corporate Auditor** is an enterprise-grade AI risk governance platform. It ingests corporate proposals, pitch decks, financial forecasts, and legal compliance contracts, orchestrating a multi-agent AI panel (**CFO**, **Legal**, **Security**, **Market**, and **Coordinator**) to discover hidden liabilities, financial margin compression, security injection vectors, and regulatory non-compliance before executive sign-off.

---

## 🏗️ System Architecture & Workflow

The platform executes a parallel **Fan-Out / Fan-In Multi-Agent StateGraph Architecture** built on **LangGraph**.

```text
                                  ┌────────────────────────┐
                                  │      User Upload       │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │ PyMuPDF Text Extractor │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │    Parallel Fan-Out LangGraph StateGraph     │
                      └──────┬────────────┬────────────┬───────┬─────┘
                             │            │            │       │
                             ▼            ▼            ▼       ▼
                        ┌─────────┐  ┌─────────┐  ┌────────┐ ┌────────┐
                        │ CFO     │  │ Legal   │  │Security│ │ Market │
                        │ Agent   │  │ Agent   │  │ Agent  │ │ Agent  │
                        └────┬────┘  └────┬────┘  └───┬────┘ └───┬────┘
                             │            │            │       │
                             └────────────┼────────────┴───────┘
                                          │
                                          ▼
                             ┌─────────────────────────┐
                             │ Coordinator Agent (CAO) │
                             └────────────┬────────────┘
                                          │
                                          ▼
                      ┌──────────────────────────────────────────────┐
                      │  PostgreSQL Persistence + 3-Page Executive  │
                      │   PDF / Excel / JSON Multi-Format Output     │
                      └──────────────────────────────────────────────┘
```

---

## 🤖 Specialized AI Domain Agents

Every domain agent implements a standardized 4-module design pattern (`prompt.py`, `parser.py`, `rules.py`, `node.py`):

1. **CFO Agent (`agents/cfo/`)**:
   - Audits unit economics, OPEX margin compression, burn rate, and revenue growth projections.
   - Enforces deterministic rules for unrealistic 50x+ ROI multipliers and inflation misalignment.

2. **Legal Agent (`agents/legal/`)**:
   - Evaluates GDPR Art 17, SOC 2 Type II, ISO 27001 compliance, employee NDAs, and contract liabilities.
   - Enforces deterministic rules for unconsented data sharing and indemnification ambiguities.

3. **Security Agent (`agents/security/`)**:
   - Scans for prompt injection attacks, hardcoded API secrets, PII exposure, and unauthenticated admin access.
   - Maps vulnerabilities directly to **OWASP Top 10** and **MITRE ATT&CK** matrix standards.

4. **Market Agent (`agents/market/`)**:
   - Benchmarks competitor pricing models, Ideal Customer Profile (ICP), customer acquisition cost (CAC), and market sizing.
   - Enforces rules for unverified TAM claims and missing competitor pricing analysis.

5. **Coordinator Agent (`agents/coordinator/`)**:
   - Deduplicates findings across domain agents and computes deterministic composite risk scores (0–100).
   - Generates a prioritized **Strategic Action Plan & Remediation Roadmap** (Immediate, Short-Term, Long-Term).

---

## 💻 Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Neon PostgreSQL, Celery + Redis, PyMuPDF, ReportLab, LangGraph, LangChain.
- **AI Models**: Ollama (`qwen2.5:7b`), DeepSeek-R1, Llama 3 8B.
- **Frontend**: React 18, Vite, Tailwind CSS, Material Symbols, Lucide Icons, Canvas API.

---

## 📁 Repository Directory Structure

```text
Corporate-Auditor/
├── backend/
│   ├── agents/
│   │   ├── cfo/              # CFO Agent (prompt, parser, rules, node)
│   │   ├── legal/            # Legal Agent (prompt, parser, rules, node)
│   │   ├── security/         # Security Agent (prompt, parser, rules, node)
│   │   ├── market/           # Market Agent (prompt, parser, rules, node)
│   │   └── coordinator/      # Coordinator Agent (prompt, parser, scorer, node)
│   ├── auth/                 # Auth JWT & Avatar Routes
│   ├── database/             # Neon PostgreSQL Models & CRUD
│   ├── graph/                # LangGraph Fan-Out Parallel Workflow
│   ├── reports/              # 3-Page Executive PDF Generator & Exporters
│   ├── schemas/              # Pydantic v2 Type Safety Schemas
│   ├── tests/                # E2E Test Suite (Phase 1 - Phase 6)
│   └── app.py                # FastAPI Server Engine
└── frontend/                 # React + Vite SaaS Dashboard
```

---

## 🛠️ Quick Start & Setup Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**
- **Ollama** running locally:
  ```bash
  ollama run qwen2.5:7b
  ```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# Install dependencies:
pip install -r requirements.txt

# Start Backend Server:
python -m uvicorn app:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be running at:
- **Frontend Portal**: `http://localhost:3000`
- **FastAPI Documentation**: `http://127.0.0.1:8000/docs`

---

## 🧪 Automated Testing

Run the Phase 6 End-to-End user journey test suite:
```bash
cd backend
venv\Scripts\python.exe tests/run_phase6_tests.py
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
