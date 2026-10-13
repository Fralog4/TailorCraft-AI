# Comprehensive Technical Blueprint: AI-Powered ATS CV Tailor

## 1. Project Vision & Ecosystem
An open-source, stateless ecosystem designed to bypass LinkedIn scraping protections legally via a client-side Chrome Extension, while using an AI-powered web application to tailor a user's CV to a specific Job Description (JD). 

The ecosystem consists of 3 decoupled components:
1. **Chrome Extension (Data Ingestion):** Extracts the JD from LinkedIn and passes it to the web app.
2. **React Frontend (User Interface):** Handles file uploads, user settings (BYOK), and displays the final PDF.
3. **FastAPI Backend (Processing Engine):** Parses documents, interacts with the LLM to rewrite the CV, and generates an ATS-compliant PDF.

---

## 2. Component 1: Chrome Extension (Manifest V3)
This is the primary method for retrieving the Job Description. It acts as a bridge between LinkedIn and the React frontend.

### Architecture & Files
- **`manifest.json`**: Must be Manifest V3.
  - Permissions: `activeTab`, `scripting`, `storage`, `tabs`.
  - Host Permissions: `*://*.linkedin.com/jobs/*`, `*://localhost:5173/*` (for dev), and the production frontend URL.
- **`background.js` (Service Worker)**: 
  - Listens for `chrome.action.onClicked`.
  - Executes a script on the active LinkedIn tab to extract text from `.jobs-description__content` or `.jobs-description-content__text`.
  - Saves the extracted text to `chrome.storage.local` under the key `extractedJD`.
  - Opens a new tab pointing to the React frontend URL.
- **`content_script.js`**:
  - Injected automatically into the React frontend URL.
  - On load, checks `chrome.storage.local` for `extractedJD`.
  - If found, finds the DOM element `<textarea id="jd-input">`, sets its value, and dispatches a `'change'` or `'input'` event so React's synthetic event system registers the update.
  - Clears `chrome.storage.local` to prevent loop injections.

---

## 3. Component 2: Frontend (React + Vite)
A fast, stateless UI. Session data is held in memory and lost on refresh.

### Tech Stack
- React 18, Vite, Tailwind CSS.
- `lucide-react` for icons.

### Key Requirements
1. **The JD Textarea:** MUST have `id="jd-input"`. This is the anchor point for the Chrome Extension.
2. **BYOK (Bring Your Own Key) Panel:** An expandable settings area where the user inputs their `API_KEY` and selects the provider (e.g., `gemini`, `openai`, `anthropic`). This data is sent with every API request.
3. **File Upload:** A dropzone accepting `.pdf` and `.docx` files.
4. **Loading States:** Detailed step-by-step loaders ("Parsing Document...", "AI Rewriting CV...", "Generating PDF...").
5. **PDF Viewer:** Display the backend-generated PDF blob using an `<iframe>` or `react-pdf`, along with a prominent "Download ATS Resume" button.

---

## 4. Component 3: Backend (FastAPI + Python)
100% stateless backend. No database, no user accounts.

### Tech Stack
- Python 3.10+, FastAPI, Uvicorn.
- Document Parsing: `pdfplumber` (for `.pdf`), `python-docx` (for `.docx`).
- LLM Integration: `google-genai` (for Gemini) or `litellm` (for a unified API across providers).
- PDF Generation: `WeasyPrint` or `pdfkit` + `Jinja2` templates.

### API Endpoint
`POST /api/v1/tailor-cv`
- **Request Type:** `multipart/form-data`
- **Fields:**
  - `file`: `UploadFile` (The user's original CV).
  - `job_description`: `str` (Passed from the frontend/extension).
  - `llm_provider`: `str` (e.g., 'gemini').
  - `api_key`: `str` (The user's BYOK).
- **Process:**
  1. Parse the uploaded file to raw text.
  2. Send raw CV and JD to the LLM.
  3. Receive structured JSON.
  4. Render JSON into the Jinja2 HTML template.
  5. Convert HTML to PDF buffer.
- **Response:** `StreamingResponse` or `FileResponse` containing the `application/pdf` binary.

### LLM Output Schema (Pydantic)
Enforce this schema using the LLM's "Structured Outputs" or JSON mode:
```python
from pydantic import BaseModel
from typing import List

class Experience(BaseModel):
    job_title: str
    company: str
    start_date: str
    end_date: str
    bullet_points: List[str] # Rewritten using action verbs and JD keywords

class Education(BaseModel):
    degree: str
    institution: str
    graduation_year: str

class TailoredCV(BaseModel):
    full_name: str
    contact_info: str 
    professional_summary: str # 3-4 sentences matching JD core requirements
    skills: List[str] # Top skills matching the JD, extracted from original CV
    experiences: List[Experience]
    education: List[Education]
```

### System Prompt Engineering
The AI logic must strictly follow these rules:
1. **Role:** Expert ATS resume optimizer.
2. **Mandate:** Tailor the provided CV to the provided Job Description.
3. **Strict Constraints:**
   - **NO HALLUCINATIONS:** Never invent skills, degrees, or job experiences the candidate does not have.
   - **Keyword Matching:** Rephrase existing bullet points to use the exact terminology and keywords found in the JD.
   - **Action-Oriented:** Ensure bullet points start with strong action verbs.
   - **Format:** Output exactly matching the requested JSON schema.

---

## 5. Component 4: ATS-Friendly PDF Template
The HTML template used by `WeasyPrint`/`pdfkit` is critical for ATS success.
- **Design:** Barebones, minimalist, professional.
- **Layout:** Strictly Single-Column. Absolutely no tables, no multi-column layouts, no sidebars, no images/headshots.
- **Typography:** Web-safe standard fonts only (Arial, Calibri, Helvetica). 
- **Hierarchy:** 
  - `<h1>` for Name.
  - `<p>` for Contact Info.
  - `<h2>` for Sections (Summary, Skills, Experience, Education).
  - Standard `<ul>` and `<li>` for skills and bullet points.
- **Dividers:** Use simple CSS `border-bottom` or `<hr>` tags to separate sections.