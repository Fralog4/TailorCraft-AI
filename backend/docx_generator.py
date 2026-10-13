import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from models import TailoredCV

def add_bottom_border(paragraph):
    """Adds a bottom border line below a heading paragraph in docx."""
    pPr = paragraph._element.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '222222')
    pBdr.append(bottom)
    pPr.append(pBdr)

DOCX_LABELS = {
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

DOCX_FONTS = {
    "modern": "Arial",
    "classic": "Georgia",
    "executive": "Calibri"
}

def generate_docx(cv: TailoredCV, template_style: str = "modern", language: str = "en") -> io.BytesIO:
    """
    Generates a minimalist, single-column ATS-compliant Microsoft Word (.docx) resume
    customized with the selected font style and localized headings.
    """
    doc = Document()
    lang_key = "it" if language.lower() in ["it", "italian", "italiano"] else "en"
    font_name = DOCX_FONTS.get(template_style.lower(), "Arial")
    labels = DOCX_LABELS[lang_key]

    # Set page margins to 0.7 inch for standard ATS readability
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # Base font style
    style = doc.styles['Normal']
    font = style.font
    font.name = font_name
    font.size = Pt(10)
    font.color.rgb = RGBColor(30, 30, 30)

    # 1. CANDIDATE HEADER
    p_name = doc.add_paragraph()
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_name.paragraph_format.space_before = Pt(0)
    p_name.paragraph_format.space_after = Pt(2)
    run_name = p_name.add_run(cv.full_name)
    run_name.bold = True
    run_name.font.name = font_name
    run_name.font.size = Pt(18)
    run_name.font.color.rgb = RGBColor(0, 0, 0)

    # Contact line
    p_contact = doc.add_paragraph()
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_contact.paragraph_format.space_before = Pt(0)
    p_contact.paragraph_format.space_after = Pt(12)
    run_contact = p_contact.add_run(cv.contact_info)
    run_contact.font.name = font_name
    run_contact.font.size = Pt(9.5)
    run_contact.font.color.rgb = RGBColor(60, 60, 60)

    # Helper for Section Headings
    def add_section_heading(title: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title.upper())
        run.bold = True
        run.font.name = font_name
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0, 0, 0)
        add_bottom_border(p)
        return p

    # 2. PROFESSIONAL SUMMARY
    if cv.professional_summary:
        add_section_heading(labels["summary"])
        p_summary = doc.add_paragraph()
        p_summary.paragraph_format.space_before = Pt(3)
        p_summary.paragraph_format.space_after = Pt(6)
        p_summary.paragraph_format.line_spacing = 1.15
        run_sum = p_summary.add_run(cv.professional_summary)
        run_sum.font.name = font_name

    # 3. CORE COMPETENCIES / SKILLS
    if cv.skills:
        add_section_heading(labels["skills"])
        for skill in cv.skills:
            p_skill = doc.add_paragraph(style='List Bullet')
            p_skill.paragraph_format.space_before = Pt(1)
            p_skill.paragraph_format.space_after = Pt(2)
            run_sk = p_skill.add_run(skill)
            run_sk.font.name = font_name

    # 4. WORK EXPERIENCE
    if cv.experiences:
        add_section_heading(labels["experience"])
        for exp in cv.experiences:
            # Job Title
            p_exp_title = doc.add_paragraph()
            p_exp_title.paragraph_format.space_before = Pt(6)
            p_exp_title.paragraph_format.space_after = Pt(1)
            run_title = p_exp_title.add_run(exp.job_title)
            run_title.bold = True
            run_title.font.name = font_name
            run_title.font.size = Pt(10.5)

            # Company & Date
            p_exp_sub = doc.add_paragraph()
            p_exp_sub.paragraph_format.space_before = Pt(0)
            p_exp_sub.paragraph_format.space_after = Pt(3)
            run_comp = p_exp_sub.add_run(f"{exp.company}  |  {exp.start_date} – {exp.end_date}")
            run_comp.italic = True
            run_comp.font.name = font_name
            run_comp.font.size = Pt(9.5)
            run_comp.font.color.rgb = RGBColor(70, 70, 70)

            # Bullet points
            for bullet in exp.bullet_points:
                p_bullet = doc.add_paragraph(style='List Bullet')
                p_bullet.paragraph_format.space_before = Pt(1)
                p_bullet.paragraph_format.space_after = Pt(2)
                p_bullet.paragraph_format.line_spacing = 1.15
                run_b = p_bullet.add_run(bullet)
                run_b.font.name = font_name

    # 5. EDUCATION
    if cv.education:
        add_section_heading(labels["education"])
        for edu in cv.education:
            p_edu = doc.add_paragraph()
            p_edu.paragraph_format.space_before = Pt(4)
            p_edu.paragraph_format.space_after = Pt(2)
            run_deg = p_edu.add_run(edu.degree)
            run_deg.bold = True
            run_deg.font.name = font_name
            run_deg.font.size = Pt(10)
            
            p_inst = doc.add_paragraph()
            p_inst.paragraph_format.space_before = Pt(0)
            p_inst.paragraph_format.space_after = Pt(4)
            run_sub = p_inst.add_run(f"{edu.institution}  |  {edu.graduation_year}")
            run_sub.font.name = font_name
            run_sub.font.size = Pt(9.5)
            run_sub.font.color.rgb = RGBColor(70, 70, 70)

    # Save to buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
