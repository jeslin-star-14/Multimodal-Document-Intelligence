import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.models.schemas import DocumentGap

logger = logging.getLogger(__name__)

STANDARD_CLAUSE_TEMPLATES = {
    "Operations & Financial Report": [
        {
            "clause_name": "Executive Summary & KPI Baseline",
            "category": "Governance",
            "keywords": ["executive summary", "overview", "kpi", "performance summary", "baseline"],
            "severity": "Critical",
            "description": "High-level summary of operational performance and quarterly targets.",
            "recommendation": "Ensure an explicit Executive Summary section is present on Page 1 or 2."
        },
        {
            "clause_name": "Root Cause Analysis (RCA)",
            "category": "Operations",
            "keywords": ["root cause", "downtime", "bottleneck", "delay", "incident", "failure analysis"],
            "severity": "Critical",
            "description": "Detailed breakdown of operational variances, supply chain disruptions, or equipment downtime.",
            "recommendation": "Document specific root causes with quantifiable impact metrics."
        },
        {
            "clause_name": "Auditor Certification & Signature",
            "category": "Compliance",
            "keywords": ["auditor", "certified by", "signature", "sign-off", "independent auditor"],
            "severity": "Moderate",
            "description": "Formal sign-off and verification from certified accounting or QA officer.",
            "recommendation": "Attach formal sign-off page or cryptographic audit stamp."
        },
        {
            "clause_name": "Risk Factors & Forward-Looking Sensitivity",
            "category": "Risk Management",
            "keywords": ["risk factors", "sensitivity", "contingency", "counterfactual", "mitigation"],
            "severity": "Moderate",
            "description": "Identification of operational vulnerabilities and forward-looking risks.",
            "recommendation": "Add sensitivity analysis for key operational variables (e.g. supply chain lead times)."
        },
        {
            "clause_name": "Inventory & Asset Reconciliation",
            "category": "Finance",
            "keywords": ["inventory", "asset", "depreciation", "reconciliation", "write-off"],
            "severity": "Low",
            "description": "Reconciliation of physical inventory and equipment depreciation schedules.",
            "recommendation": "Include quarterly closing asset balance table."
        }
    ],
    "Legal & Contract Agreement": [
        {
            "clause_name": "Limitation of Liability",
            "category": "Legal",
            "keywords": ["limitation of liability", "indemnification", "damages", "aggregate liability"],
            "severity": "Critical",
            "description": "Cap on monetary damages and exclusion of indirect/consequential damages.",
            "recommendation": "Ensure mutually agreed liability cap is explicitly defined."
        },
        {
            "clause_name": "Termination & Exit Rights",
            "category": "Legal",
            "keywords": ["termination", "term and termination", "notice period", "breach"],
            "severity": "Critical",
            "description": "Procedures for termination for convenience or cause and transition obligations.",
            "recommendation": "Specify written notice periods (e.g., 30 days) and data return provisions."
        },
        {
            "clause_name": "Governing Law & Jurisdiction",
            "category": "Compliance",
            "keywords": ["governing law", "jurisdiction", "arbitration", "dispute resolution"],
            "severity": "Moderate",
            "description": "Choice of law and designated courts/arbitration forum.",
            "recommendation": "Designate governing state/country law and dispute venue."
        }
    ]
}

def analyze_document_gaps(
    document_id: str,
    processed_dir: Path
) -> Dict[str, Any]:
    """
    Performs automated Gap Analysis on a document by scanning for standard industry clauses
    and identifying missing compliance, risk, or operational disclosures.
    """
    # Find processed JSON
    processed_files = list(processed_dir.glob(f"*{document_id}*.json"))
    if not processed_files:
        processed_files = list(processed_dir.glob("*.json"))
        
    doc_text = ""
    doc_name = "Document"
    if processed_files:
        try:
            with open(processed_files[0], "r", encoding="utf-8") as f:
                doc_data = json.load(f)
                doc_name = doc_data.get("document_name", "Document")
                for ev in doc_data.get("evidence", []):
                    doc_text += " " + (ev.get("text") or "")
                    if ev.get("table"):
                        doc_text += " " + " ".join(ev["table"].get("headers", []))
        except Exception as e:
            logger.warning(f"Failed to read processed doc for gap analysis: {e}")

    doc_text_lower = doc_text.lower()
    
    # Determine document template
    template_key = "Operations & Financial Report"
    if any(w in doc_text_lower for w in ["agreement", "contract", "parties", "indemnity"]):
        template_key = "Legal & Contract Agreement"
        
    template = STANDARD_CLAUSE_TEMPLATES.get(template_key, STANDARD_CLAUSE_TEMPLATES["Operations & Financial Report"])
    
    gaps: List[DocumentGap] = []
    present_count = 0
    missing_count = 0
    
    for i, item in enumerate(template):
        # Check keyword matches
        matches = [kw for kw in item["keywords"] if kw in doc_text_lower]
        if len(matches) >= 2:
            status = "Present"
            present_count += 1
        elif len(matches) == 1:
            status = "Partial"
        else:
            status = "Missing"
            missing_count += 1
            
        gaps.append(DocumentGap(
            id=f"gap-{i+1}",
            clause_name=item["clause_name"],
            category=item["category"],
            status=status,
            severity=item["severity"],
            description=item["description"],
            recommendation=item["recommendation"]
        ))
        
    completeness_score = int((present_count / len(template)) * 100) if template else 85
    
    return {
        "success": True,
        "document_id": document_id,
        "document_name": doc_name,
        "document_type": template_key,
        "completeness_score": completeness_score,
        "missing_clauses_count": missing_count,
        "total_clauses_checked": len(template),
        "gaps": [g.model_dump() for g in gaps]
    }
