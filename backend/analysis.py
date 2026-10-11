"""
CRIMVEXA WITNESS — Baseline Text Analysis
Rule-based category/priority suggestions and missing-field detection.
"""

import math
import re

POTENTIAL_DUPLICATE_THRESHOLD = 0.35
_TOKEN_PATTERN = re.compile(r"[^\W_]+", re.UNICODE)
_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "by", "for",
    "from", "had", "has", "have", "i", "in", "is", "it", "me", "my",
    "of", "on", "or", "our", "the", "this", "to", "was", "we", "were",
    "with", "case", "complaint", "crime", "incident", "report", "reported",
}

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
    """Combine supported text fields, ignoring missing or non-string values."""
    if not isinstance(complaint, dict):
        raise ValueError("complaint must be a dictionary")
    parts = [
        complaint.get(field)
        for field in (
            "title", "description", "location", "item_details",
            "escape_direction", "reported_category",
        )
    ]
    return " ".join(value for value in parts if isinstance(value, str)).casefold()


def _field_text(complaint: dict, field: str) -> str:
    value = complaint.get(field)
    return value.strip() if isinstance(value, str) else ""


def _matching_keywords(
    text: str, keywords: list[str], ignore_negated: bool = False,
) -> list[str]:
    """Match whole words or phrases, not accidental substrings."""
    matches = []
    for keyword in keywords:
        escaped_keyword = re.escape(keyword).replace("\\ ", "\\s+")
        pattern = rf"(?<!\w){escaped_keyword}(?!\w)"
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if ignore_negated:
                context = text[max(0, match.start() - 40):match.start()]
                if re.search(
                    r"\b(?:no|not|never|without|isn't|aren't|wasn't|"
                    r"weren't|didn't|doesn't|don't)\b(?:\W+\w+){0,3}\W*$",
                    context,
                ):
                    continue
            matches.append(keyword)
    return matches


def classify(complaint: dict) -> dict:
    """
    Return suggested category, priority, and reasoning.
    Results are automated suggestions requiring human review.
    """
    text = _text(complaint)

    # ── Category ─────────────────────────────────────────────────────────────
    category_matches = []
    for rule in CATEGORY_RULES:
        hits = _matching_keywords(text, rule["keywords"], ignore_negated=True)
        if hits:
            category_matches.append((len(hits), rule["category"], hits))

    if category_matches:
        _, matched_category, hits = max(category_matches, key=lambda item: item[0])
        category_reason = f"Keywords detected: {', '.join(hits[:3])}"
    else:
        matched_category = "Other / Unclassified"
        category_reason = "No strong keyword match found. Manual review needed."

    # ── Priority ──────────────────────────────────────────────────────────────
    high_hits = _matching_keywords(text, HIGH_PRIORITY_KEYWORDS, ignore_negated=True)
    low_hits = _matching_keywords(text, LOW_PRIORITY_KEYWORDS, ignore_negated=True)

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

    desc = _field_text(complaint, "description")
    if len(desc) < 20:
        issues.append({
            "field": "description",
            "question": "Can you describe what happened in more detail?"
        })

    if not _field_text(complaint, "location"):
        issues.append({
            "field": "location",
            "question": "Where did the incident take place? (e.g. street name, landmark, city)"
        })

    if not _field_text(complaint, "incident_time"):
        issues.append({
            "field": "incident_time",
            "question": "When did this happen? (date and approximate time)"
        })

    # Only ask about items if the complaint seems property-related
    property_keywords = [
        "stolen", "theft", "lost", "missing", "robbery", "snatch",
        "fraud", "scam",
    ]
    if _matching_keywords(text, property_keywords):
        if not _field_text(complaint, "item_details"):
            issues.append({
                "field": "item_details",
                "question": "Can you describe the item(s) involved? (e.g. type, colour, estimated value)"
            })

    # Only ask about suspect/escape if it seems like a physical crime
    physical_keywords = [
        "stolen", "robbery", "robbed", "snatch", "assault", "attack",
        "threat",
    ]
    if _matching_keywords(text, physical_keywords):
        if not _field_text(complaint, "escape_direction"):
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
    if not isinstance(top_n, int) or isinstance(top_n, bool) or top_n < 1:
        raise ValueError("top_n must be a positive integer")
    text = _text(complaint)

    scored = []
    for case in SYNTHETIC_CASES:
        hits = _matching_keywords(text, case["keywords"])
        if hits:
            scored.append({
                "case_id":      case["case_id"],
                "category":     case["category"],
                "summary":      case["summary"],
                "match_reason": f"Shared keywords: {', '.join(hits)}",
                "match_score":  len(hits) / len(case["keywords"]),
            })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    result = [{k: v for k, v in c.items() if k != "match_score"} for c in scored[:top_n]]

    if not result:
        return []   # Caller adds "no match" message

    return result


def find_potential_duplicates(
    complaint: dict,
    candidates,
    top_n: int = 3,
    threshold: float = POTENTIAL_DUPLICATE_THRESHOLD,
) -> list:
    """Return staff-only lexical TF-IDF/cosine candidates above the threshold."""
    if not isinstance(complaint, dict):
        raise ValueError("complaint must be a dictionary")
    if not isinstance(top_n, int) or isinstance(top_n, bool) or top_n < 1:
        raise ValueError("top_n must be a positive integer")
    if not isinstance(threshold, (int, float)) or not 0 <= threshold <= 1:
        raise ValueError("threshold must be between 0 and 1")
    if candidates is None:
        raise ValueError("candidates must be iterable")

    query_id = complaint.get("complaint_id")
    documents = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            candidate = dict(candidate)
        if candidate.get("complaint_id") == query_id:
            continue
        documents.append(candidate)

    def terms(record):
        text = _text(record)
        return [
            token for token in _TOKEN_PATTERN.findall(text)
            if len(token) > 1 and token not in _STOP_WORDS
        ]

    query_terms = terms(complaint)
    if not query_terms:
        return []

    candidate_terms = [terms(candidate) for candidate in documents]
    corpus_size = len(candidate_terms) + 1
    document_frequency = {}
    for document in [query_terms, *candidate_terms]:
        for term in set(document):
            document_frequency[term] = document_frequency.get(term, 0) + 1

    def vectorize(tokens):
        counts = {}
        for token in tokens:
            counts[token] = counts.get(token, 0) + 1
        vector = {
            token: (1 + math.log(count)) *
            (math.log((corpus_size + 1) / (document_frequency[token] + 1)) + 1)
            for token, count in counts.items()
        }
        norm = math.sqrt(sum(weight * weight for weight in vector.values()))
        return ({token: weight / norm for token, weight in vector.items()}
                if norm else {})

    query_vector = vectorize(query_terms)
    if not query_vector:
        return []

    scored = []
    for candidate, tokens in zip(documents, candidate_terms):
        candidate_vector = vectorize(tokens)
        score = sum(
            weight * candidate_vector.get(token, 0)
            for token, weight in query_vector.items()
        )
        if score > 0 and score >= threshold:
            description = candidate.get("description")
            scored.append({
                "case_id": candidate.get("complaint_id"),
                "category": candidate.get("category"),
                "status": candidate.get("status"),
                "created_at": candidate.get("created_at"),
                "summary": description[:200] if isinstance(description, str) else "",
                "similarity": round(min(score, 1.0), 4),
            })

    scored.sort(key=lambda match: (-match["similarity"], match["case_id"] or ""))
    return scored[:top_n]
