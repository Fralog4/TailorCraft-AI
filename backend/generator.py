import io
import os
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from models import TailoredCV

# Setup Jinja2 environment
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

# Style and Language Configurations
SECTION_LABELS = {
    "en": {
        "summary": "Professional Summary",
        "skills": "Core Competencies & Technical Skills",
        "experience": "Professional Experience",
        "education": "Education & Credentials"
    },
    "it": {
        "summary": "Profilo Professionale",
        "skills": "Competenze Tecniche & Core Competencies",
        "experience": "Esperienza Professionale",
        "education": "Istruzione e Formazione"
    }
}

STYLE_CONFIGS = {
    "modern": {
        "font_family": "Arial, Helvetica, sans-serif",
        "heading_color": "#000000",
        "border_color": "#222222"
    },
    "classic": {
        "font_family": "'Times New Roman', Times, serif",
        "heading_color": "#111111",
        "border_color": "#333333"
    },
    "executive": {
        "font_family": "Trebuchet MS, Arial, sans-serif",
        "heading_color": "#0f172a",
        "border_color": "#475569"
    }
}

def render_resume_html(cv_data: TailoredCV, template_style: str = "modern", language: str = "en") -> str:
    """Renders the TailoredCV model into the ATS HTML template with chosen style and language."""
    template = env.get_template("ats_resume.html")
    lang_key = "it" if language.lower() in ["it", "italian", "italiano"] else "en"
    style_key = template_style.lower() if template_style.lower() in STYLE_CONFIGS else "modern"
    
    return template.render(
        cv=cv_data,
        style_cfg=STYLE_CONFIGS[style_key],
        labels=SECTION_LABELS[lang_key]
    )

def generate_pdf(cv_data: TailoredCV, template_style: str = "modern", language: str = "en") -> io.BytesIO:
    """
    Renders the ATS-compliant HTML and converts it to a PDF in memory.
    Uses xhtml2pdf for reliable, pure-Python cross-platform PDF compilation.
    """
    html_content = render_resume_html(cv_data, template_style=template_style, language=language)
    pdf_buffer = io.BytesIO()

    # Convert HTML to PDF
    pisa_status = pisa.CreatePDF(
        src=html_content,
        dest=pdf_buffer,
        encoding="utf-8"
    )

    if pisa_status.err:
        raise RuntimeError(f"xhtml2pdf encountered an error while compiling resume: {pisa_status.err}")

    pdf_buffer.seek(0)
    return pdf_buffer
