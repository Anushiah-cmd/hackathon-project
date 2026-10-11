"""
CRIMVEXA WITNESS — Baseline Text Analysis
Rule-based category/priority suggestions and missing-field detection.
"""

import re

# ── Category keyword rules ────────────────────────────────────────────────────
CATEGORY_RULES = [
    {
        "category": "Theft",
        "keywords": ["stolen", "steal", "theft", "robbed", "robbery", "pickpocket",
                     "snatched", "snatch", "burglar", "burglary", "broke in", "broke into"],
    },
    {
        "category": "Online / Cyber Fraud",
        "keywords": ["fraud", "scam", "phishing", "otp", "upi", "bank transfer",
                     "online", "cyber", "hack", "hacked", "fake website", "fake call",
                     "cheated online", "money transferred"],
    },
    {
        "category": "Harassment / Threat",
        "keywords": ["harass", "threat", "threaten", "abuse", "assault", "stalker",
                     "stalk", "bully", "bullying", "intimidate", "intimidation",
                     "domestic", "violence", "attacked"],
    },
    {
        "category": "Lost Property",
        "keywords": ["lost", "missing", "misplaced", "cannot find", "left behind",
                     "dropped", "forgot", "found"],
    },
]

# ── Priority rules ────────────────────────────────────────────────────────────
HIGH_PRIORITY_KEYWORDS = [
    "weapon", "gun", "knife", "violent", "violence", "assault", "injured",
    "bleeding", "unconscious", "kidnap", "abduct", "threat to life", "emergency",
    "attack", "attacked", "murder", "rape", "sexual assault"
]

LOW_PRIORITY_KEYWORDS = [
    "lost", "misplaced", "minor", "small", "trivial", "noise", "nuisance"
]


def _text(complaint: dict) -> str:
    """Combine all text fields into one lowercase string for matching."""
    parts = [
        complaint.get("title") or "",
        complaint.get("description") or "",
        complaint.get("location") or "",
        complaint.get("item_details") or "",
        complaint.get("escape_direction") or "",
        complaint.get("reported_category") or "",
    ]
    return " ".join(parts).lower()


def classify(complaint: dict) -> dict:
    """
    Return suggested category, priority, and reasoning.
    Results are automated suggestions requiring human review.
    """
    text = _text(complaint)

    # ── Category ─────────────────────────────────────────────────────────────
    matched_category = None
    category_reason = None
    for rule in CATEGORY_RULES:
        hits = [kw for kw in rule["keywords"] if kw in text]
        if hits:
            matched_category = rule["category"]
            category_reason = f"Keywords detected: {', '.join(hits[:3])}"
            break

    if not matched_category:
        matched_category = "Other / Unclassified"
        category_reason = "No strong keyword match found. Manual review needed."

    # ── Priority ──────────────────────────────────────────────────────────────
    high_hits = [kw for kw in HIGH_PRIORITY_KEYWORDS if kw in text]
    low_hits  = [kw for kw in LOW_PRIORITY_KEYWORDS  if kw in text]

    if high_hits:
        priority = "High"
        priority_reason = f"High-risk keywords detected: {', '.join(high_hits[:3])}"
    elif low_hits:
        priority = "Low"
        priority_reason = f"Low-severity keywords detected: {', '.join(low_hits[:3])}"
    elif matched_category in ("Online / Cyber Fraud", "Theft"):
        priority = "Medium"
        priority_reason = "Category suggests medium priority by default."
    else:
        priority = "Medium"
        priority_reason = "No strong priority signal; defaulting to Medium."

    return {
        "category": matched_category,
        "priority": priority,
        "category_reason": category_reason,
        "priority_reason": priority_reason,
        "disclaimer": (
            "⚠️ Automated suggestion only. Requires human officer review. "
            "If this is an emergency, call 112 immediately."
        ),
    }


def detect_missing(complaint: dict) -> list:
    """
    Return a list of {field, question} dicts for missing/unclear details.
    Only flags fields relevant to the type of complaint.
    """
    text   = _text(complaint)
    issues = []

    desc = (complaint.get("description") or "").strip()
    if len(desc) < 20:
        issues.append({
            "field": "description",
            "question": "Can you describe what happened in more detail?"
        })

    if not (complaint.get("location") or "").strip():
        issues.append({
            "field": "location",
            "question": "Where did the incident take place? (e.g. street name, landmark, city)"
        })

    if not (complaint.get("incident_time") or "").strip():
        issues.append({
            "field": "incident_time",
            "question": "When did this happen? (date and approximate time)"
        })

    # Only ask about items if the complaint seems property-related
    property_keywords = ["stolen", "theft", "lost", "missing", "robbery", "snatch", "fraud", "scam"]
    if any(kw in text for kw in property_keywords):
        if not (complaint.get("item_details") or "").strip():
            issues.append({
                "field": "item_details",
                "question": "Can you describe the item(s) involved? (e.g. type, colour, estimated value)"
            })

    # Only ask about suspect/escape if it seems like a physical crime
    physical_keywords = ["stolen", "robbery", "robbed", "snatch", "assault", "attack", "threat"]
    if any(kw in text for kw in physical_keywords):
        if not (complaint.get("escape_direction") or "").strip():
            issues.append({
                "field": "escape_direction",
                "question": "Did you notice which direction the suspect went, or any suspect description?"
            })

    return issues


# ── Synthetic sample cases ────────────────────────────────────────────────────
SYNTHETIC_CASES = [
    {
        "case_id": "SYN-001",
        "category": "Theft",
        "summary": "[FICTIONAL] Mobile phone snatched near Central Bus Stand by a person on a motorcycle.",
        "keywords": ["phone", "snatch", "mobile", "motorcycle", "bus stand"],
    },
    {
        "case_id": "SYN-002",
        "category": "Online / Cyber Fraud",
        "summary": "[FICTIONAL] Victim received a fake bank OTP call and lost ₹15,000 from their account.",
        "keywords": ["otp", "bank", "call", "fraud", "money", "account", "upi"],
    },
    {
        "case_id": "SYN-003",
        "category": "Theft",
        "summary": "[FICTIONAL] Laptop and wallet stolen from a parked car near a shopping mall.",
        "keywords": ["laptop", "wallet", "car", "parked", "mall", "stolen"],
    },
    {
        "case_id": "SYN-004",
        "category": "Harassment / Threat",
        "summary": "[FICTIONAL] Person received repeated threatening messages from an unknown number.",
        "keywords": ["message", "threat", "threaten", "number", "call", "harass"],
    },
    {
        "case_id": "SYN-005",
        "category": "Lost Property",
        "summary": "[FICTIONAL] Bag containing documents and cash left behind in a taxi.",
        "keywords": ["bag", "lost", "taxi", "documents", "cash", "left"],
    },
    {
        "case_id": "SYN-006",
        "category": "Online / Cyber Fraud",
        "summary": "[FICTIONAL] Victim paid for goods on a fake e-commerce website and never received them.",
        "keywords": ["online", "website", "paid", "scam", "fake", "order", "delivery"],
    },
    {
        "case_id": "SYN-007",
        "category": "Theft",
        "summary": "[FICTIONAL] House burglary reported — back window broken, jewellery and cash taken.",
        "keywords": ["house", "burglar", "broke", "window", "jewellery", "cash", "stolen"],
    },
]


def find_similar(complaint: dict, top_n: int = 3) -> list:
    """
    Compare a complaint to synthetic sample cases using keyword overlap.
    Returns up to top_n matches. Returns empty list if no overlap found.
    """
    text = _text(complaint)
    words = set(re.findall(r"\w+", text))

    scored = []
    for case in SYNTHETIC_CASES:
        hits = [kw for kw in case["keywords"] if kw in text or kw in words]
        if hits:
            scored.append({
                "case_id":      case["case_id"],
                "category":     case["category"],
                "summary":      case["summary"],
                "match_reason": f"Shared keywords: {', '.join(hits)}",
                "match_score":  len(hits),
            })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    result = [{k: v for k, v in c.items() if k != "match_score"} for c in scored[:top_n]]

    if not result:
        return []   # Caller adds "no match" message

    return result
