# 🚀 Adversarial Corporate Auditor

> Enterprise Multi-Agent Corporate Audit & Risk Assessment System powered by **LangGraph**, **LangChain**, **FastAPI**, and local **Ollama (`qwen2.5:7b`)**.

---

## 🏛️ System Architecture

The system utilizes a modular, multi-agent state graph architecture built on **LangGraph**. A uploaded corporate proposal or document flows through specialized domain expert agents before being synthesized by the Chief Audit Officer (Coordinator Agent).

```text
               START
                 │
                 ▼
             Upload PDF
                 │
                 ▼
        Extract Text (PyMuPDF)
                 │
                 ▼
    ┌──────────────────────────┐
    │    LangGraph Workflow    │
    └──────────────────────────┘
                 │
                 ▼
             CFO Agent
                 │
                 ▼
            Legal Agent
                 │
                 ▼
          Security Agent
                 │
                 ▼
           Market Agent
                 │
                 ▼
       Coordinator Agent (CAO)
                 │
                 ▼
                END
```

---

## 🤖 Domain Agents Breakdown

Every agent follows a unified, standardized 4-module design pattern (`prompt.py`, `parser.py`, `rules.py`, `node.py`):

1. **CFO Agent (`agents/cfo/`)**:
   * Analyzes financial feasibility, budget allocations, burn rate, ROI anomalies, and cost structures.
   * Includes deterministic rules for 50x+ ROI multiplier anomalies and aggressive short timelines.

2. **Legal Agent (`agents/legal/`)**:
   * Evaluates GDPR, SOC 2, ISO 27001, Privacy Policy/T&C gaps, employee NDAs, and contract risks.
   * Includes deterministic rules for plaintext password storage and unconsented customer data sharing.

3. **Security Agent (`agents/security/`)**:
   * Detects prompt injection, hardcoded secrets/API keys, SQL injection, unsafe code execution (`eval`/`exec`), and unauthenticated admin access.
   * Maps findings to **OWASP Top 10** and **MITRE ATT&CK** frameworks.

4. **Market Agent (`agents/market/`)**:
   * Evaluates market viability, customer segmentation (ICP), pricing strategy, SWOT analysis, and competitive positioning.
   * Includes deterministic business rules for missing competition, pricing, and USP.

5. **Coordinator Agent (`agents/coordinator/`)**:
   * Synthesizes findings across all 4 specialist agents without re-analyzing the original document.
   * Performs deterministic scoring, issue deduplication, and generates a structured executive action plan (`immediate`, `short_term`, `long_term`) and health verdict.

---

## 📁 Repository Directory Structure

```text
Corporate-Auditor/
│
├── backend/
│   ├── agents/
│   │   ├── cfo/              # CFO Agent (prompt, parser, rules, node)
│   │   ├── legal/            # Legal Agent (prompt, parser, rules, node)
│   │   ├── security/         # Security Agent (prompt, parser, rules, node)
│   │   ├── market/           # Market Agent (prompt, parser, rules, node)
│   │   └── coordinator/      # Coordinator Agent (prompt, parser, scorer, node)
│   │
│   ├── graph/
│   │   ├── state.py          # Shared AgentState TypedDict
│   │   ├── llm.py            # Reusable ChatOllama instance
│   │   ├── graph_builder.py  # StateGraph builder and compilation
│   │   └── workflow.py       # Compiled app_graph export
│   │
│   ├── schemas/              # Pydantic v2 Type Safety Schemas
│   │   ├── common.py
│   │   ├── cfo.py
│   │   ├── legal.py
│   │   ├── security.py
│   │   ├── market.py
│   │   └── audit.py
│   │
│   ├── utils/                # System Utilities
│   │   ├── json_utils.py     # JSON repair & Pydantic validation helper
│   │   ├── logger.py         # Standardized logging utility
│   │   └── pdf_reader.py     # PyMuPDF text extractor
│   │
│   ├── tests/                # Test Suites & Sample Documents
│   │   ├── sample_documents/
│   │   │   └── proposal.pdf
│   │   ├── test_cfo.py
│   │   ├── test_legal.py
│   │   ├── test_security.py
│   │   ├── test_market.py
│   │   └── test_coordinator.py
│   │
│   ├── app.py                # FastAPI REST API (/audit, /cfo, /legal, /security, /market)
│   └── requirements.txt
│
└── frontend/                 # Frontend Dashboard
```

---

## 🛠️ Setup & Installation

### Prerequisites
* Python 3.10+
* [Ollama](https://ollama.com/) running locally with `qwen2.5:7b` model installed:
  ```bash
  ollama run qwen2.5:7b
  ```

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HackIndiaXYZ/hackindia-spark-11-hyderabad-telangana-south-central-region-505-error.git
   cd hackindia-spark-11-hyderabad-telangana-south-central-region-505-error/backend
   ```

2. **Set up Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Test Suite**:
   ```bash
   python tests/test_coordinator.py
   ```

5. **Start FastAPI Development Server**:
   ```bash
   uvicorn app:app --reload
   ```
   Open Swagger UI documentation at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
