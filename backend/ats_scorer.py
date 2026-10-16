import re
from typing import List, Dict, Tuple
from pydantic import BaseModel
from models import TailoredCV

# Common stop words (English and Italian) to ignore during ATS keyword extraction
STOP_WORDS = {
    # English stop words
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "as", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "we", "you", "they", "it", "our", "your", "their",
    "will", "would", "can", "could", "should", "may", "might", "must", "about",
    "into", "through", "during", "before", "after", "above", "below", "from",
    "up", "down", "over", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few",
    "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "s", "t", "just", "don", "shouldn", "now",
    "experience", "years", "role", "work", "job", "candidate", "responsibilities",
    "requirements", "seeking", "looking", "plus", "ability", "strong", "skills",
    "team", "company", "position", "preferred", "minimum", "qualifications",
    "including", "ensure", "working", "related", "equivalent", "opportunity",
    "who", "what", "where", "join", "joining", "mid-level", "senior-level", "entry-level",
    "contribute", "contributing", "enhancing", "enhance", "help", "helping", "seeking", "welcome",
    "apply", "applying", "application", "equal", "employer", "diversity", "inclusion",
    # Italian stop words & common boilerplate
    "di", "a", "da", "in", "con", "su", "per", "tra", "fra", "il", "lo", "la",
    "i", "gli", "le", "un", "uno", "una", "e", "ed", "o", "od", "ma", "anche",
    "se", "come", "dove", "chi", "che", "cui", "quale", "quali", "del", "dello",
    "della", "dei", "degli", "delle", "al", "allo", "alla", "ai", "agli", "alle",
    "dal", "dallo", "dalla", "dai", "dagli", "dalle", "nel", "nello", "nella",
    "nei", "negli", "nelle", "sul", "sullo", "sulla", "sui", "sugli", "sulle",
    "sull", "informazioni", "descrizione", "mostra", "visualizza", "altro", "meno",
    "segnala", "quest", "vorresti", "lavorare", "futuro", "premesso", "seguente",
    "ambiti", "candidatura", "candidarsi", "posizione", "figure", "figura", "scopri", "unisciti",
    "anni", "anno", "esperienza", "esperienze", "requisiti", "requisito",
    "candidato", "candidata", "candidati", "azienda", "ruolo", "lavoro",
    "offerta", "competenze", "competenza", "capacità", "conoscenza", "conoscenze",
    "attività", "gestione", "sviluppo", "sviluppatore", "sviluppatrice", "progetto",
    "progetti", "gruppo", "società", "settore", "sede", "richiesta", "richiesto",
    "richiesti", "richieste", "mansione", "mansioni", "profilo",
    "inserimento", "contratto", "tempo", "indeterminato", "determinato", "full-time",
    "part-time", "remoto", "ibrido", "smart-working", "laurea", "diploma", "titolo",
    "studi", "ottima", "buona", "livello", "autonomia", "collaborazione", "clienti",
    "cliente", "servizi", "supporto", "definizione", "attraverso", "inoltre", "presso",
    "sarà", "sarai", "offriamo", "cerchiamo", "opportunità", "nostro", "nostra",
    "principali", "orientamento", "risultati", "risorse", "ambiente",
    "title", "company", "junior", "senior", "jr", "sr", "ad", "ed", "al", "ai",
    "agli", "alle", "lavorerai", "svilupperai", "seguire", "utilizzate", "utilizzati",
    "contatto", "diretto", "esplorerai", "utilizzo", "soluzioni",
    "efficienza", "background", "formativo", "stem",
    "paradigmi", "applicazioni", "utenti", "business", "forte", "potenziale",
    "capacita", "imparare", "crescere", "contesto", "sfide"
}

# Key multi-word compound technical phrases
COMPOUND_PHRASES = [
    "machine learning", "deep learning", "artificial intelligence", "data science",
    "computer vision", "natural language processing", "system design", "cloud computing",
    "full stack", "front end", "back end", "ci/cd", "ci/cd pipelines", "rest api",
    "restful api", "microservices architecture", "project management", "scrum master",
    "agile methodology", "cyber security", "business intelligence", "devops engineering",
    "react native", "spring boot", "next.js", "vue.js", "node.js", "unit testing",
    "test driven development", "version control", "infrastructure as code"
]

class ATSAnalysis(BaseModel):
    score: int
    match_level: str
    matched_keywords: List[str]
    missing_keywords: List[str]
    analysis_summary: str

def extract_keywords(text: str) -> List[str]:
    """Extracts significant keywords and phrases from text, including multi-word terms and tech tokens."""
    cleaned = []
    seen = set()
    text_lower = text.lower()

    # 1. Match compound multi-word tech phrases first
    for phrase in COMPOUND_PHRASES:
        pattern = r"(?<![A-Za-z0-9])" + re.escape(phrase) + r"(?![A-Za-z0-9])"
        if re.search(pattern, text_lower) and phrase not in seen:
            seen.add(phrase)
            for part in phrase.split():
                seen.add(part.lower())
            # Find the actual casing in the original text if possible
            match = re.search(pattern, text, re.IGNORECASE)
            cleaned.append(match.group(0) if match else phrase)

    # 2. Extract technical tokens (e.g. C++, C#, .NET, Python, AWS, Docker, K8s, CI/CD)
    tokens = re.findall(r"(?<![A-Za-z0-9])([A-Za-z0-9+#\.\/\-_]{2,})(?![A-Za-z0-9])", text)
    
    for w in tokens:
        clean_w = w.strip(".,;:()[]{}\"'-_").lower()
        # Must contain at least one alphanumeric character
        if not re.search(r"[a-z0-9]", clean_w):
            continue
        if (
            len(clean_w) >= 2 
            and clean_w not in STOP_WORDS 
            and not clean_w.isnumeric()
            and clean_w not in seen
        ):
            seen.add(clean_w)
            cleaned.append(w.strip(".,;:()[]{}\"'-_"))
            
    return cleaned

def calculate_ats_match(cv: TailoredCV, job_description: str) -> ATSAnalysis:
    """
    Compares the tailored CV against the target Job Description to measure
    keyword coverage and calculate an ATS compliance score (0-100%).
    """
    # Combine all CV text
    cv_text_parts = [
        cv.full_name,
        cv.professional_summary,
        " ".join(cv.skills),
    ]
    for exp in cv.experiences:
        cv_text_parts.append(f"{exp.job_title} {exp.company} {' '.join(exp.bullet_points)}")
    for edu in cv.education:
        cv_text_parts.append(f"{edu.degree} {edu.institution}")

    full_cv_text = " ".join(cv_text_parts).lower()
    jd_keywords = extract_keywords(job_description)

    matched = []
    missing = []

    for kw in jd_keywords:
        # Punctuation-safe word boundary matching (supports C++, C#, .NET, etc.)
        pattern = r"(?<![A-Za-z0-9])" + re.escape(kw.lower()) + r"(?![A-Za-z0-9])"
        if re.search(pattern, full_cv_text):
            matched.append(kw)
        else:
            missing.append(kw)

    total_kws = len(matched) + len(missing)
    if total_kws == 0:
        raw_score = 85
    else:
        # Base ratio of matched keywords
        kw_ratio = len(matched) / total_kws
        # Scaled score with bonus for structure completeness
        raw_score = int(min(98, max(50, (kw_ratio * 70) + 25)))

    # Determine match level
    if raw_score >= 85:
        match_level = "High Match (ATS Ready)"
    elif raw_score >= 70:
        match_level = "Good Match"
    else:
        match_level = "Moderate Match"

    # Limit lists to top relevant keywords
    top_matched = list(dict.fromkeys(matched))[:12]
    top_missing = list(dict.fromkeys(missing))[:8]

    summary = (
        f"Your CV matches {len(matched)} key requirements from the target Job Description. "
        f"Identified {len(top_matched)} primary matching keywords integrated into your summary, skills, and bullet points."
    )

    return ATSAnalysis(
        score=raw_score,
        match_level=match_level,
        matched_keywords=top_matched,
        missing_keywords=top_missing,
        analysis_summary=summary
    )
