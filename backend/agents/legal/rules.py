import re
from typing import Dict, Any, List

def run_legal_rules(text: str) -> Dict[str, Any]:
    """
    Executes deterministic Python rule-based checks on document text
    to catch obvious compliance gaps, missing documents, and data protection risks.
    Returns dictionary with additional issues and missing_documents.
    """
    rule_issues = []
    missing_docs = []
    
    text_lower = text.lower()

    # Rule 1: Customer Data Storage without explicit Privacy Policy / Consent
    if 'stores customer information' in text_lower or 'customer information' in text_lower or 'user data' in text_lower:
        if 'privacy policy' not in text_lower or 'consent' not in text_lower:
            missing_docs.append("Privacy Policy")
            rule_issues.append({
                "issue": "GDPR Issues & Missing Privacy Policy",
                "severity": "High",
                "reason": "Customer information is stored without explicit data subject consent mechanisms or a documented Privacy Policy.",
                "recommendation": "Implement GDPR-compliant data processing agreements and publish a comprehensive Privacy Policy.",
                "reference": "GDPR Article 13 (Information to be Provided)"
            })

    # Rule 2: Plain text password storage
    if re.search(r'passwords?\s+(?:are\s+)?stored\s+in\s+plain\s*text', text_lower) or 'plain text password' in text_lower:
        rule_issues.append({
            "issue": "Plaintext Credential Storage",
            "severity": "Critical",
            "reason": "Passwords are stored in plain text without hashing or encryption, exposing user credentials.",
            "recommendation": "Use strong salted hashing algorithms (bcrypt or Argon2) immediately.",
            "reference": "GDPR Article 32 (Security of Processing)"
        })

    # Rule 3: Missing Privacy Policy general rule
    if 'no privacy policy' in text_lower or ('privacy policy' not in text_lower and 'privacy' not in text_lower and "GDPR Issues & Missing Privacy Policy" not in [r["issue"] for r in rule_issues]):
        missing_docs.append("Privacy Policy")
        rule_issues.append({
            "issue": "Missing Privacy Policy",
            "severity": "High",
            "reason": "No documented privacy policy exists to inform data subjects of processing activities.",
            "recommendation": "Draft, publish, and link a GDPR-compliant Privacy Policy.",
            "reference": "GDPR Article 13 (Information to be Provided)"
        })

    return {
        "rule_issues": rule_issues,
        "missing_documents": missing_docs
    }
