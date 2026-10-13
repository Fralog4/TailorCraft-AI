# 🚀 AI-Powered ATS Resume Tailor & Job Scraper

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF.svg)](https://vitejs.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-green.svg)](https://developer.chrome.com/docs/extensions/)

Un ecosistema open-source e **100% stateless** per analizzare, ottimizzare e formattare curriculum vitae in formato conforme agli **Applicant Tracking Systems (ATS)**, aggirando le restrizioni di scraping di LinkedIn in modo trasparente e legale tramite un'estensione Chrome client-side.

---

## 🔒 Sicurezza & Privacy (Stateless & Zero Hardcoding)

Questo progetto è stato ingegnerizzato seguendo i principi di **Privacy by Design** e **Zero-Trust**:

- 🔑 **Bring Your Own Key (BYOK)**: Le tue chiavi API (Google Gemini, OpenAI, Anthropic Claude, Groq) **non vengono mai salvate su server o database**. Risiedono unicamente nel `localStorage` del browser del client e vengono trasmesse solo per l'elaborazione della singola richiesta HTTP.
- 🛡️ **Zero Data Retention**: Il backend non memorizza i file caricati, i testi delle Job Description né i CV generati su disco fisso. Tutto avviene in streaming in memoria RAM (`io.BytesIO`).
- 🔐 **Nessun Segreto Hardcoded**: Nessun token o percorso assoluto è cablato nel codice sorgente. Tutte le configurazioni opzionali passano tramite variabili d'ambiente (`.env`).
- 🛑 **File Upload Hardening**: Validazione restrittiva dei MIME types e delle estensioni ammesse (`.pdf`, `.docx`, `.doc`, `.txt`), con blocco a livello di payload su file eccedenti i 15MB (HTTP 413) e sanitizzazione degli errori per prevenire memory leak o XSS.
- 🌐 **CORS Configurabile**: Controllo esplicito delle origini consentite tramite variabile `ALLOWED_ORIGINS`.

---

## 🏛️ Architettura del Sistema

```
Linkedin/
├── extension/             # Componente 1: Estensione Chrome (Manifest V3)
│   ├── manifest.json
│   ├── background.js      # Service Worker: estrae la JD dal DOM di LinkedIn
│   ├── content_script.js    # Inietta la JD direttamente nel form dell'app
│   └── icons/             # Icone extension (16, 48, 128)
│
├── frontend/              # Componente 2: UI Reattiva React 18 + Vite
│   ├── src/
│   │   ├── components/    # Wizard guidato a 2 step, BYOK Modal, ATS Scorer
│   │   ├── App.jsx
│   │   └── index.css      # Design Obsidian Dark Mode moderno & fluido
│   ├── .env.example
│   └── package.json
│
└── backend/               # Componente 3: Motore FastAPI Stateless
    ├── main.py            # Endpoints REST (/api/v1/tailor-cv, /api/v1/analyze-ats-score)
    ├── models.py          # Schemi Pydantic per validazione strutturata
    ├── parser.py          # Parser PDF (pdfplumber) e DOCX (python-docx)
    ├── llm_service.py     # Orchestratore multi-LLM (Gemini, GPT-4o, Claude 3.5, Llama 3.3)
    ├── generator.py       # Compilatore PDF ATS a colonna singola (xhtml2pdf / Jinja2)
    ├── docx_generator.py  # Generatore file Microsoft Word (.docx) nativo
    ├── ats_scorer.py      # Algoritmo di matching pesato delle keyword
    ├── .env.example
    └── requirements.txt
```

---

## ✨ Funzionalità Principali

1. **Flusso Guidato a 2 Step (Wizard Flow)**:
   - **Step 1: Input & Setup**: Carica il CV originale (PDF, DOCX o TXT), incolla o ricevi la Job Description da LinkedIn, e seleziona il provider AI.
   - **Step 2: ATS Optimization Suite**: Schermata a piena larghezza con anteprima in tempo reale, analisi delle keyword, score di compatibilità e pulsanti di download.
2. **Standard ATS a Rigida Colonna Singola**:
   - Zero tabelle a griglia complessa, zero icone decorative grafiche che mandano in tilt i parser ATS (Workday, Taleo, Greenhouse, iCIMS).
   - Formattazione tipografica pulita, margini uniformi e font leggibili standard.
3. **Google XYZ Impact Formula**:
   - Riscrive le esperienze professionali applicando la formula: *"Accomplished [X] as measured by [Y], by doing [Z]"*, enfatizzando metriche percentuali, ROI ed efficienza.
4. **Analizzatore di Compatibilità ATS in Tempo Reale**:
   - Calcolo istantaneo del match score (%) tra le keyword della Job Description e il testo del CV ottimizzato, con badge interattivi verdi per le keyword coperte e suggerimenti per quelle mancanti.
5. **Doppia Esportazione Professionale**:
   - **PDF Pronto per l'Invio**: Compilato ad alta fedeltà vettoriale.
   - **Microsoft Word (.docx) Modificabile**: Documento Word pulito, formattato con titoli, elenchi puntati e sezioni modificabili.
6. **Supporto Multi-LLM**:
   - **Google Gemini**: `gemini-2.5-flash`, `gemini-1.5-pro` (Disponibile con tier gratuito via Google AI Studio).
   - **OpenAI**: `gpt-4o-mini`, `gpt-4o`.
   - **Anthropic**: `claude-3-5-sonnet`.
   - **Groq**: `llama-3.3-70b-versatile` (inferenza ultra-veloce).

---

## 🚀 Guida di Installazione e Avvio Rapido

### Opzione A: Avvio Rapido 1-Click (Windows)
Fai semplicemente doppio clic su [`start.bat`](start.bat) oppure esegui con PowerShell:
```powershell
.\start.ps1
```
Il launcher verificherà le dipendenze, avvierà backend e frontend su due finestre separate e aprirà il browser su `http://localhost:5173`.

---

### Opzione B: Con Docker Compose
Assicurati di avere Docker installato e attivo:
```bash
docker-compose up --build
```
- Frontend disponibile su: `http://localhost:5173`
- Backend API su: `http://localhost:8000`

---

### Opzione C: Esecuzione Manuale

#### 1. Backend (Python)
```bash
cd backend
python -m venv .venv

# Su Windows:
.venv\Scripts\activate
# Su Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -u run_server.py
```
Il backend risponderà su `http://127.0.0.1:8000`.

#### 2. Frontend (Node.js / React)
In un altro terminale:
```bash
cd frontend
npm install
npm run dev
```
Il frontend sarà accessibile su `http://localhost:5173`.

---

## 🧩 Installazione dell'Estensione Chrome (Opzionale)

1. Apri Google Chrome e naviga su `chrome://extensions/`.
2. Attiva la modalità sviluppatore (**Developer mode**) in alto a destra.
3. Clicca su **Carica estensione non pacchettizzata** (**Load unpacked**).
4. Seleziona la cartella `extension/` di questo repository.
5. Vai su un'offerta di lavoro su LinkedIn e clicca sull'icona dell'estensione: la Job Description verrà estratta e aperta istantaneamente nell'app web!

---

## ⚙️ Variabili d'Ambiente (Opzionali)

Tutte le configurazioni dispongono di fallback predefiniti sicuri per lo sviluppo locale:

### Backend (`backend/.env` - opzionale)
```env
PORT=8000
HOST=127.0.0.1
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_FILE_SIZE_BYTES=15728640
```

### Frontend (`frontend/.env` - opzionale)
```env
VITE_BACKEND_URL=http://localhost:8000
```

---

## 🛡️ Guida per la Pubblicazione su GitHub

Se stai per pubblicare questo repository su GitHub:

1. Inizializza il repository locale (se non già presente):
   ```bash
   git init
   ```
2. Aggiungi i file (il file `.gitignore` incluso esclude automaticamente `.venv`, `node_modules`, log e file `.env`):
   ```bash
   git add .
   ```
3. Effettua il commit iniziale:
   ```bash
   git commit -m "feat: initial release of AI ATS Resume Tailor"
   ```
4. Collega il tuo repository remoto su GitHub e fai il push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<tuo-utente>/<tuo-repo>.git
   git push -u origin main
   ```

---

## 📄 Licenza

Rilasciato sotto licenza [MIT](LICENSE). Libero per uso personale e commerciale.
