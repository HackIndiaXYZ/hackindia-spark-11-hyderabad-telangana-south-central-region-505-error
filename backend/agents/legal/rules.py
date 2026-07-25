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

    # Rule 1: Plain text password storage
    if re.search(r'passwords?\s+(?:are\s+)?stored\s+in\s+plain\s*text', text_lower) or 'plain text password' in text_lower:
        rule_issues.append({
            "issue": "Plaintext Credential Storage",
            "severity": "Critical",
            "reason": "Passwords are stored in plain text without hashing or encryption, exposing user credentials.",
            "recommendation": "Use strong salted hashing algorithms (bcrypt or Argon2) immediately.",
            "reference": "GDPR Article 32 (Security of Processing)"
        })

    # Rule 2: Unconsented third-party data sharing
    if ('shared with' in text_lower or 'third parties' in text_lower or 'marketing companies' in text_lower) and not ('consent' in text_lower or 'opt-in' in text_lower):
        rule_issues.append({
            "issue": "Third-Party Data Sharing Without Explicit Consent",
            "severity": "High",
            "reason": "Customer data is shared with third parties or marketing partners without documented consent.",
            "recommendation": "Obtain explicit opt-in consent and execute Data Processing Agreements (DPAs).",
            "reference": "GDPR Article 6 (Lawfulness of Processing)"
        })

    # Rule 3: Storage of sensitive national identifiers (Aadhaar / SSN)
    if 'aadhaar' in text_lower or 'ssn' in text_lower or 'social security number' in text_lower:
        rule_issues.append({
            "issue": "Sensitive Identifier Storage Exposure",
            "severity": "Critical",
            "reason": "National identity numbers (Aadhaar/SSN) are collected and stored, requiring strict regulatory compliance.",
            "recommendation": "Ensure data tokenization, access controls, and strict compliance with national privacy regulations.",
            "reference": "GDPR Article 9 (Special Category Data)"
        })

    # Rule 4: Missing Privacy Policy
    if 'no privacy policy' in text_lower or ('privacy policy' not in text_lower and 'privacy' not in text_lower):
        missing_docs.append("Privacy Policy")
        rule_issues.append({
            "issue": "Missing Privacy Policy",
            "severity": "High",
            "reason": "No documented privacy policy exists to inform data subjects of processing activities.",
            "recommendation": "Draft, publish, and link a GDPR-compliant Privacy Policy.",
            "reference": "GDPR Article 13 (Information to be Provided)"
        })

    # Rule 5: Missing Terms & Conditions
    if 'no terms' in text_lower or ('terms & conditions' not in text_lower and 'terms and conditions' not in text_lower):
        missing_docs.append("Terms & Conditions")
        rule_issues.append({
            "issue": "Missing Terms & Conditions",
            "severity": "High",
            "reason": "No Terms & Conditions are available to establish clear legal terms of service.",
            "recommendation": "Establish binding Terms & Conditions for user interaction.",
            "reference": "Not specified"
        })

    # Rule 6: Missing Confidentiality / NDA
    if 'no employee confidentiality' in text_lower or 'no nda' in text_lower:
        missing_docs.append("Employee Non-Disclosure Agreement (NDA)")
        rule_issues.append({
            "issue": "Missing Employee Confidentiality Agreement",
            "severity": "High",
            "reason": "Employees do not sign non-disclosure or confidentiality agreements.",
            "recommendation": "Implement mandatory NDAs for all staff handling customer or proprietary data.",
            "reference": "ISO 27001 A.7.1.2"
        })

    return {
        "rule_issues": rule_issues,
        "missing_documents": missing_docs
    }
