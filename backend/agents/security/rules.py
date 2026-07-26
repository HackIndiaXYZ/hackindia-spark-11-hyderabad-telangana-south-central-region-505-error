import re
from typing import Dict, Any, List

def run_security_rules(text: str) -> Dict[str, Any]:
    """
    Executes deterministic regex and keyword security checks against document text.
    Identifies hardcoded secrets, prompt injections, SQL injections, and dangerous code patterns.
    """
    rule_issues = []
    attack_surface = set()
    text_lower = text.lower()

    # Rule 1: Hardcoded Passwords
    if re.search(r'(?:password|passwd|pwd)\s*[:=]\s*["\']?[a-zA-Z0-9_!@#$%^&*]{3,}', text, re.IGNORECASE) or 'passwords stored in plain text' in text_lower or 'password=admin' in text_lower:
        attack_surface.add("Secrets Management")
        rule_issues.append({
            "issue": "Hardcoded / Plaintext Password Exposure",
            "severity": "Critical",
            "category": "Secrets Management",
            "reason": "Hardcoded or plaintext passwords were detected directly in document strings.",
            "recommendation": "Remove plaintext credentials and utilize a secure secret store or environment variables.",
            "reference": "CWE-259: Use of Hard-coded Password",
            "confidence": 0.99
        })

    # Rule 2: Exposed API Keys & Bearer Tokens
    if re.search(r'(?:api_key|apikey|secret_key|bearer_token)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{8,}', text, re.IGNORECASE) or 'sk-' in text or 'bearer ' in text_lower or 'send api keys' in text_lower:
        attack_surface.add("Secrets Management")
        rule_issues.append({
            "issue": "Exposed API Key / Authentication Token",
            "severity": "Critical",
            "category": "Secrets Management",
            "reason": "Production API keys or OAuth Bearer tokens are requested or hardcoded in document text.",
            "recommendation": "Revoke exposed tokens immediately and load API keys securely via environment variables.",
            "reference": "CWE-798: Use of Hard-coded Credentials",
            "confidence": 0.98
        })

    # Rule 3: Prompt Injection / System Override Indicators
    if re.search(r'ignore\s+(?:all\s+)?previous\s+instructions', text_lower) or 'reveal confidential' in text_lower or 'system prompt' in text_lower or 'jailbreak' in text_lower:
        attack_surface.add("AI / LLM Interface")
        rule_issues.append({
            "issue": "Prompt Injection Detected",
            "severity": "Critical",
            "category": "AI / LLM Security",
            "reason": "Text contains prompt override patterns designed to subvert system instructions and leak confidential data.",
            "recommendation": "Sanitize user inputs, enforce strict prompt demarcation, and employ input validation guardrails.",
            "reference": "OWASP Top 10 for LLM Applications: LLM01 - Prompt Injection",
            "confidence": 0.99
        })

    # Rule 4: Dynamic SQL Construction (SQL Injection)
    if re.search(r'select\s+.*\s+from\s+.*\s+where\s+.*[\+\.][\s]*[a-zA-Z_]', text_lower) or 'select * from users where id=' in text_lower:
        attack_surface.add("Database Interface")
        rule_issues.append({
            "issue": "SQL Injection Vulnerability",
            "severity": "Critical",
            "category": "Input Validation",
            "reason": "Dynamic string concatenation in SQL queries allows arbitrary database query injection.",
            "recommendation": "Use parameterized queries, prepared statements, or ORM parameter binding.",
            "reference": "OWASP A03:2021-Injection / CWE-89",
            "confidence": 0.97
        })

    # Rule 5: Unsafe Code Execution (`eval`, `exec`, `subprocess`, `rm -rf`)
    if re.search(r'\b(eval|exec|subprocess|os\.system)\b', text) or 'rm -rf' in text_lower:
        attack_surface.add("System Execution")
        rule_issues.append({
            "issue": "Dangerous Unsafe Execution Functions",
            "severity": "Critical",
            "category": "Command Execution",
            "reason": "Usage of arbitrary code/command execution utilities (`eval`, `exec`, `subprocess`) detected.",
            "recommendation": "Avoid dynamic code execution and sandbox process execution boundaries.",
            "reference": "CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code",
            "confidence": 0.96
        })

    # Rule 6: Missing Authentication / Open Admin Dashboards
    if ('accessible without login' in text_lower or 'no authentication' in text_lower or 'publicly accessible' in text_lower) and ('admin' in text_lower or 'dashboard' in text_lower or 'database' in text_lower):
        attack_surface.add("Authentication & Access Control")
        rule_issues.append({
            "issue": "Unauthenticated Administrative Surface Access",
            "severity": "Critical",
            "category": "Authentication",
            "reason": "Administrative portals or databases are exposed without authentication controls.",
            "recommendation": "Enforce mandatory multi-factor authentication (MFA) and RBAC on all admin endpoints.",
            "reference": "OWASP A01:2021-Broken Access Control",
            "confidence": 0.94
        })

    return {
        "rule_issues": rule_issues,
        "attack_surface": list(attack_surface)
    }
