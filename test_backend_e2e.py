import requests
import json
import io
import zipfile

BASE_URL = "http://127.0.0.1:8000"

def test_backend_e2e():
    print("=== [1/5] Testing /api/v1/health ===")
    res = requests.get(f"{BASE_URL}/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    health_data = res.json()
    print("Health response:", health_data)
    assert health_data["status"] == "healthy"

    print("\n=== [2/5] Testing /api/v1/preview-sample (PDF) ===")
    res = requests.get(f"{BASE_URL}/api/v1/preview-sample")
    assert res.status_code == 200, f"PDF sample failed: {res.status_code}"
    pdf_bytes = res.content
    assert pdf_bytes.startswith(b"%PDF"), "Response is not a valid PDF file"
    print(f"Sample PDF received successfully ({len(pdf_bytes)} bytes)")

    print("\n=== [3/5] Testing /api/v1/preview-sample-docx (Word) ===")
    res = requests.get(f"{BASE_URL}/api/v1/preview-sample-docx")
    assert res.status_code == 200, f"DOCX sample failed: {res.status_code}"
    docx_bytes = res.content
    assert docx_bytes.startswith(b"PK"), "Response is not a valid DOCX zip archive"
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
        assert "word/document.xml" in zf.namelist(), "Missing word/document.xml in DOCX"
    print(f"Sample DOCX received and verified ({len(docx_bytes)} bytes)")

    print("\n=== [4/5] Testing /api/v1/compile-json-to-pdf and DOCX ===")
    sample_cv = {
        "full_name": "Mario Rossi",
        "contact_info": "Milano, Italia | mario.rossi@email.it | +39 340 1234567 | linkedin.com/in/mariorossi",
        "professional_summary": "Ingegnere del software con forte background in Java, Python, Machine Learning e architetture distribuite ad alte prestazioni.",
        "skills": [
            "Java, Spring Boot, Python, C++, SQL, Docker, Linux",
            "Sistemi di Trading Real-Time, Machine Learning, HPC, Git, CI/CD"
        ],
        "experiences": [
            {
                "job_title": "Software Developer Junior",
                "company": "Fintech Solutions Italia",
                "start_date": "Gen 2023",
                "end_date": "Presente",
                "bullet_points": [
                    "Sviluppato microservizi in Java e Python per l'elaborazione di dati finanziari in tempo reale.",
                    "Ottimizzato le prestazioni delle query riducendo la latenza del 35%.",
                    "Collaborato all'integrazione di modelli di Machine Learning per la predictive analysis."
                ]
            }
        ],
        "education": [
            {
                "degree": "Laurea Magistrale in Ingegneria Informatica",
                "institution": "Politecnico di Milano",
                "graduation_year": "2022"
            }
        ]
    }

    res_pdf = requests.post(f"{BASE_URL}/api/v1/compile-json-to-pdf", json=sample_cv)
    assert res_pdf.status_code == 200, f"Compile PDF failed: {res_pdf.status_code}"
    assert res_pdf.content.startswith(b"%PDF")
    print(f"Compiled PDF from JSON successfully ({len(res_pdf.content)} bytes)")

    res_docx = requests.post(f"{BASE_URL}/api/v1/compile-json-to-docx", json=sample_cv)
    assert res_docx.status_code == 200, f"Compile DOCX failed: {res_docx.status_code}"
    assert res_docx.content.startswith(b"PK")
    print(f"Compiled DOCX from JSON successfully ({len(res_docx.content)} bytes)")

    print("\n=== [5/5] Testing /api/v1/analyze-ats-score with real Sella Job Description ===")
    sella_jd = """
    Job Title: Software Developer Jr - Trading Support
    Company: Sella
    ---
    Svilupperai sistemi ad alte prestazioni per il trading.
    Lavorerai su applicazioni real-time utilizzate da trader e quant.
    Analisi dei requisiti a contatto diretto con utenti business.
    Esplorerai l'utilizzo di soluzioni data-driven e AI / Machine Learning a supporto dell'efficienza.
    COSA CERCHIAMO:
    Background formativo brillante STEM (Informatica, Ingegneria, Matematica, Fisica).
    Buona conoscenza di Java e/o Python e dei paradigmi object-oriented.
    """
    
    res_score = requests.post(
        f"{BASE_URL}/api/v1/analyze-ats-score",
        json={"cv": sample_cv, "job_description": sella_jd}
    )
    assert res_score.status_code == 200, f"ATS score failed: {res_score.status_code}"
    score_data = res_score.json()
    print("ATS Score Analysis Output:")
    print(json.dumps(score_data, indent=2))
    assert score_data["score"] >= 50, f"Expected valid score, got {score_data['score']}"
    assert "java" in [k.lower() for k in score_data["matched_keywords"]]
    assert "python" in [k.lower() for k in score_data["matched_keywords"]]
    assert "machine learning" in [k.lower() for k in score_data["matched_keywords"]]
    print("\n>>> ALL BACKEND E2E TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    test_backend_e2e()
