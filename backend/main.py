import io
import os
import traceback
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse

from models import TailoredCV, Experience, Education
from parser import parse_cv_file
from llm_service import tailor_cv_with_llm, boost_cv_with_keywords
from generator import generate_pdf, render_resume_html
from docx_generator import generate_docx
from ats_scorer import calculate_ats_match, ATSAnalysis

# Security Configurations
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_BYTES", str(15 * 1024 * 1024)))  # 15MB limit
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

cors_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

app = FastAPI(
    title="TailorCraft AI API",
    version="1.2.0",
    description="Stateless backend engine for parsing CVs, engineering them with LLMs for ATS compatibility, calculating keyword scores, and generating single-column PDF & DOCX resumes."
)

# Enable CORS for frontend and Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Candidate-Name", "X-ATS-Score", "X-ATS-Level", "X-Matched-Keywords-Count"]
)

def validate_uploaded_file(file: UploadFile, file_bytes: bytes) -> None:
    """Validates file presence, size limits and allowed extensions."""
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size limit of {max_mb}MB."
        )
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TailorCraft AI",
        "features": ["pdf_generation", "docx_export", "ats_scoring", "multi_llm"],
        "supported_providers": ["gemini", "openai", "anthropic", "groq", "openrouter"]
    }


@app.post("/api/v1/tailor-cv")
async def tailor_cv_endpoint(
    file: UploadFile = File(..., description="Original CV file (.pdf, .docx, .txt)"),
    job_description: str = Form(..., description="Target Job Description text"),
    llm_provider: str = Form("gemini", description="LLM provider name"),
    api_key: str = Form(..., description="User's API Key"),
    model: Optional[str] = Form(None, description="Optional custom model identifier"),
    language: str = Form("en", description="Target language ('en' or 'it')"),
    template_style: str = Form("modern", description="Template style ('modern', 'classic', 'executive')")
):
    """
    Main endpoint: Parses CV, calls LLM to tailor according to JD,
    computes ATS score, and returns an ATS-compliant PDF.
    """
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    if not api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key is required to use the LLM."
        )

    try:
        # Step 1: Parse and validate uploaded document
        file_bytes = await file.read()
        validate_uploaded_file(file, file_bytes)
        
        raw_cv_text = parse_cv_file(file_bytes, file.filename)

        # Step 2: Call LLM with structured ATS schema and language
        tailored_cv = await tailor_cv_with_llm(
            cv_raw_text=raw_cv_text,
            job_description=job_description,
            llm_provider=llm_provider,
            api_key=api_key,
            model_name=model,
            language=language
        )

        # Step 3: Compute ATS match score
        ats_analysis = calculate_ats_match(tailored_cv, job_description)

        # Step 4: Generate ATS-compliant single-column PDF
        pdf_buffer = generate_pdf(tailored_cv, template_style=template_style, language=language)

        clean_name = tailored_cv.full_name.replace(' ', '_') if tailored_cv.full_name else "Candidate"
        filename = f"{clean_name}_ATS_Resume.pdf"

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "X-Candidate-Name": tailored_cv.full_name,
                "X-ATS-Score": str(ats_analysis.score),
                "X-ATS-Level": ats_analysis.match_level,
                "X-Matched-Keywords-Count": str(len(ats_analysis.matched_keywords)),
            }
        )

    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor resume: {str(exc)}"
        )


@app.post("/api/v1/tailor-cv-json")
async def tailor_cv_json_endpoint(
    file: UploadFile = File(..., description="Original CV file (.pdf, .docx, .txt)"),
    job_description: str = Form(..., description="Target Job Description text"),
    llm_provider: str = Form("gemini", description="LLM provider name"),
    api_key: str = Form(..., description="User's API Key"),
    model: Optional[str] = Form(None, description="Optional custom model identifier"),
    language: str = Form("en", description="Target language ('en' or 'it')")
):
    """
    Returns both the tailored CV structured JSON and the detailed ATS Match Score Analysis.
    """
    if not job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description cannot be empty."
        )

    if not api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key is required to use the LLM."
        )

    try:
        file_bytes = await file.read()
        validate_uploaded_file(file, file_bytes)
        raw_cv_text = parse_cv_file(file_bytes, file.filename)

        tailored_cv = await tailor_cv_with_llm(
            cv_raw_text=raw_cv_text,
            job_description=job_description,
            llm_provider=llm_provider,
            api_key=api_key,
            model_name=model,
            language=language
        )

        ats_analysis = calculate_ats_match(tailored_cv, job_description)

        return JSONResponse(content={
            "cv": tailored_cv.model_dump(),
            "ats_analysis": ats_analysis.model_dump()
        })
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate structured CV: {str(exc)}"
        )


class BoostKeywordsRequest(BaseModel):
    cv: TailoredCV
    job_description: str
    target_keywords: list[str]
    llm_provider: str = "gemini"
    api_key: str
    model: Optional[str] = None
    language: str = "en"


@app.post("/api/v1/boost-cv-keywords")
async def boost_cv_keywords_endpoint(payload: BoostKeywordsRequest):
    """
    Takes the current CV and an explicit list of missing target keywords,
    calls the LLM to weave them in using Google's XYZ formula, and re-calculates the ATS score.
    """
    if not payload.api_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key is required to boost the CV."
        )

    if not payload.target_keywords:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one target keyword must be provided."
        )

    try:
        boosted_cv = await boost_cv_with_keywords(
            current_cv=payload.cv,
            job_description=payload.job_description,
            target_keywords=payload.target_keywords,
            llm_provider=payload.llm_provider,
            api_key=payload.api_key,
            model_name=payload.model,
            language=payload.language
        )

        ats_analysis = calculate_ats_match(boosted_cv, payload.job_description)

        return JSONResponse(content={
            "cv": boosted_cv.model_dump(),
            "ats_analysis": ats_analysis.model_dump()
        })
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to boost CV with keywords: {str(exc)}"
        )



@app.post("/api/v1/compile-json-to-pdf")
async def compile_json_to_pdf_endpoint(
    cv_data: TailoredCV,
    template_style: str = "modern",
    language: str = "en"
):
    """
    Compiles a previously tailored JSON into an ATS PDF with chosen style and language.
    """
    try:
        pdf_buffer = generate_pdf(cv_data, template_style=template_style, language=language)
        clean_name = cv_data.full_name.replace(' ', '_') if cv_data.full_name else "Candidate"
        filename = f"{clean_name}_ATS_Resume.pdf"

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"'
            }
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile PDF: {str(exc)}"
        )


@app.post("/api/v1/compile-json-to-docx")
async def compile_json_to_docx_endpoint(
    cv_data: TailoredCV,
    template_style: str = "modern",
    language: str = "en"
):
    """
    Compiles a previously tailored JSON into an editable ATS Microsoft Word (.docx) file
    with chosen style and language.
    """
    try:
        docx_buffer = generate_docx(cv_data, template_style=template_style, language=language)
        clean_name = cv_data.full_name.replace(' ', '_') if cv_data.full_name else "Candidate"
        filename = f"{clean_name}_ATS_Resume.docx"

        return Response(
            content=docx_buffer.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile Word document: {str(exc)}"
        )


class ATSAnalysisRequest(TailoredCV):
    pass

class AnalyzeScorePayload(BaseModel):
    cv: TailoredCV
    job_description: str

@app.post("/api/v1/analyze-ats-score")
async def analyze_ats_score_endpoint(payload: AnalyzeScorePayload):
    """
    Computes ATS Match Analysis between tailored CV and target Job Description.
    """
    try:
        analysis = calculate_ats_match(payload.cv, payload.job_description)
        return JSONResponse(content=analysis.model_dump())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(exc)}"
        )


def _get_sample_cv():
    return TailoredCV(
        full_name="Alex Morgan",
        contact_info="San Francisco, CA | alex.morgan@email.com | +1 (555) 234-5678 | linkedin.com/in/alexmorgan | github.com/alexmorgan",
        professional_summary="Results-driven Senior Full-Stack Engineer with 6+ years of expertise in architecting high-scale distributed systems, React web applications, and cloud-native microservices. Proven track record of reducing latency by 42% and driving engineering velocity across cross-functional product teams.",
        skills=[
            "Python, FastAPI, TypeScript, React, Next.js, Node.js",
            "PostgreSQL, Redis, Elasticsearch, Docker, Kubernetes, AWS (ECS, Lambda, S3)",
            "System Architecture, CI/CD Pipelines, REST & GraphQL APIs, ATS Optimization"
        ],
        experiences=[
            Experience(
                job_title="Senior Software Engineer",
                company="TechPulse Innovations",
                start_date="Jan 2022",
                end_date="Present",
                bullet_points=[
                    "Architected high-throughput microservices using FastAPI and Redis, handling 15M+ daily requests with 99.98% uptime.",
                    "Spearheaded redesign of core React dashboard, improving Core Web Vitals by 35% and enhancing customer retention.",
                    "Implemented automated CI/CD deployment pipelines on AWS ECS, slashing release cycle duration from 4 days to 45 minutes."
                ]
            ),
            Experience(
                job_title="Full Stack Software Engineer",
                company="Nexus Systems",
                start_date="Jun 2019",
                end_date="Dec 2021",
                bullet_points=[
                    "Engineered real-time data streaming features with WebSockets and PostgreSQL, accelerating reporting speed by 4x.",
                    "Mentored 4 junior engineers on clean code practices, automated unit testing, and design patterns.",
                    "Collaborated with product designers to implement accessible, responsive UI design systems."
                ]
            )
        ],
        education=[
            Education(
                degree="B.S. in Computer Science",
                institution="University of California, Berkeley",
                graduation_year="2019"
            )
        ]
    )


@app.get("/api/v1/preview-sample")
async def preview_sample_pdf(template_style: str = "modern", language: str = "en"):
    """Generates sample ATS PDF with selected template style and language."""
    sample_cv = _get_sample_cv()
    pdf_buffer = generate_pdf(sample_cv, template_style=template_style, language=language)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'inline; filename="Sample_ATS_Resume.pdf"',
            "X-Candidate-Name": sample_cv.full_name,
            "X-ATS-Score": "94",
            "X-ATS-Level": "High Match (ATS Ready)"
        }
    )


@app.get("/api/v1/preview-sample-docx")
async def preview_sample_docx(template_style: str = "modern", language: str = "en"):
    """Generates sample ATS Word document (.docx) with selected template style and language."""
    sample_cv = _get_sample_cv()
    docx_buffer = generate_docx(sample_cv, template_style=template_style, language=language)
    return Response(
        content=docx_buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": 'attachment; filename="Sample_ATS_Resume.docx"'
        }
    )
