import os
import shutil
from fastapi import FastAPI, UploadFile, File
from utils.pdf_reader import extract_text
from graph.workflow import app_graph

app = FastAPI(
    title="Adversarial Corporate Auditor API",
    version="5.0.0",
    description="Enterprise Multi-Agent Adversarial Corporate Auditor powered by LangGraph & Ollama"
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Adversarial Corporate Auditor Multi-Agent System",
        "agents": ["CFO", "Legal", "Security", "Market", "Coordinator"],
        "engine": "LangGraph + Ollama (qwen2.5:7b)"
    }

@app.post("/cfo")
async def audit_cfo(file: UploadFile = File(...)):
    """Accepts a PDF upload and returns CFO financial audit analysis."""
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(path)
    final_state = app_graph.invoke({"document_text": text})

    return {
        "filename": file.filename,
        "result": final_state.get("cfo_result")
    }

@app.post("/legal")
async def audit_legal(file: UploadFile = File(...)):
    """Accepts a PDF upload and returns Legal compliance analysis."""
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(path)
    final_state = app_graph.invoke({"document_text": text})

    return {
        "filename": file.filename,
        "result": final_state.get("legal_result")
    }

@app.post("/security")
async def audit_security(file: UploadFile = File(...)):
    """Accepts a PDF upload and returns Cybersecurity risk analysis."""
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(path)
    final_state = app_graph.invoke({"document_text": text})

    return {
        "filename": file.filename,
        "result": final_state.get("security_result")
    }

@app.post("/market")
async def audit_market(file: UploadFile = File(...)):
    """Accepts a PDF upload and returns Market strategy & viability analysis."""
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(path)
    final_state = app_graph.invoke({"document_text": text})

    return {
        "filename": file.filename,
        "result": final_state.get("market_result")
    }

@app.post("/audit")
async def audit_full(file: UploadFile = File(...)):
    """
    Primary Endpoint: Accepts a PDF upload and executes full multi-agent workflow
    (CFO -> Legal -> Security -> Market -> Coordinator) returning executive AuditReport.
    """
    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(path)
    final_state = app_graph.invoke({"document_text": text})

    return {
        "filename": file.filename,
        "audit_result": final_state.get("audit_result"),
        "agent_reports": {
            "cfo": final_state.get("cfo_result"),
            "legal": final_state.get("legal_result"),
            "security": final_state.get("security_result"),
            "market": final_state.get("market_result")
        }
    }
