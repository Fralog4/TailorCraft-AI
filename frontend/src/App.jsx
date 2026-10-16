import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  Settings,
  ShieldCheck,
  Puzzle,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Type
} from 'lucide-react';

import BYOKSettings, { PROVIDERS } from './components/BYOKSettings';
import JobDescriptionInput from './components/JobDescriptionInput';
import FileUploadZone from './components/FileUploadZone';
import LoadingProgress from './components/LoadingProgress';
import PdfViewerPanel from './components/PdfViewerPanel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function App() {
  // BYOK State
  const [provider, setProvider] = useState(() => localStorage.getItem('ats_provider') || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ats_api_key') || '');
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('ats_model');
    if (saved) return saved;
    const defaultObj = PROVIDERS.find((p) => p.id === (localStorage.getItem('ats_provider') || 'gemini'));
    return defaultObj ? defaultObj.defaultModel : 'gemini-2.5-flash';
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showExtensionHelp, setShowExtensionHelp] = useState(false);

  // Wizard Navigation State (1: Input Dati, 2: Suite CV & Audit)
  const [activeWizardStep, setActiveWizardStep] = useState(1);

  // Form Inputs
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);

  // Processing State
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);

  // Results
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState('Tailored_ATS_Resume.pdf');
  const [cvStructuredData, setCvStructuredData] = useState(null);
  const [atsAnalysis, setAtsAnalysis] = useState(null);

  // Template Style & Language Customization
  const [templateStyle, setTemplateStyle] = useState(() => localStorage.getItem('ats_template_style') || 'modern');
  const [cvLanguage, setCvLanguage] = useState(() => localStorage.getItem('ats_cv_language') || 'en');
  const [isRecompiling, setIsRecompiling] = useState(false);

  // Persist BYOK to localStorage
  useEffect(() => {
    localStorage.setItem('ats_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('ats_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('ats_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('ats_cv_language', cvLanguage);
  }, [cvLanguage]);

  useEffect(() => {
    localStorage.setItem('ats_template_style', templateStyle);
  }, [templateStyle]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Handle Tailoring Submission
  const handleTailorCV = async () => {
    setErrorMessage(null);

    if (!file) {
      setErrorMessage('Please upload your original CV (.pdf, .docx, or .txt).');
      return;
    }

    if (!jobDescription.trim()) {
      setErrorMessage('Please enter the target Job Description (or use the Chrome Extension).');
      return;
    }

    if (!apiKey.trim()) {
      setShowSettings(true);
      setErrorMessage('Please provide your API Key in the BYOK settings panel above.');
      return;
    }

    setIsLoading(true);
    setCurrentStep(1);

    try {
      const timerStep2 = setTimeout(() => setCurrentStep(2), 1500);
      const timerStep3 = setTimeout(() => setCurrentStep(3), 4500);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('job_description', jobDescription);
      formData.append('llm_provider', provider);
      formData.append('api_key', apiKey);
      if (model) formData.append('model', model);
      formData.append('language', cvLanguage);

      // Call JSON endpoint to get structured CV and ATS analysis
      const jsonRes = await fetch(`${BACKEND_URL}/api/v1/tailor-cv-json`, {
        method: 'POST',
        body: formData
      });

      clearTimeout(timerStep2);
      clearTimeout(timerStep3);

      if (!jsonRes.ok) {
        let errDetail = 'Failed to tailor resume.';
        try {
          const errJson = await jsonRes.json();
          errDetail = errJson.detail || errDetail;
        } catch (e) {}
        throw new Error(errDetail);
      }

      const { cv, ats_analysis } = await jsonRes.json();
      setCvStructuredData(cv);
      setAtsAnalysis(ats_analysis);

      // Now compile to PDF with chosen style and language
      setCurrentStep(3);
      const compileRes = await fetch(
        `${BACKEND_URL}/api/v1/compile-json-to-pdf?template_style=${templateStyle}&language=${cvLanguage}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cv)
        }
      );

      if (!compileRes.ok) {
        throw new Error('Failed to compile PDF resume.');
      }

      const blob = await compileRes.blob();
      const newBlobUrl = URL.createObjectURL(blob);
      const cleanName = cv.full_name ? cv.full_name.replace(/\s+/g, '_') : 'Candidate';
      const filename = `${cleanName}_ATS_Resume.pdf`;

      setPdfBlobUrl(newBlobUrl);
      setPdfFilename(filename);
      setActiveWizardStep(2);

    } catch (err) {
      console.error(err);
      let msg = err.message || 'An unexpected error occurred during tailoring.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION_REFUSED')) {
        msg = `Impossibile comunicare con il server Backend (${BACKEND_URL}). Assicurati che il backend FastAPI sia in esecuzione (es. apri un terminale nella cartella 'backend' ed esegui 'python -u run_server.py', oppure avvia 'start.bat').`;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setCurrentStep(1);
    }
  };

  // Live Recompile Function for Inline Editor and Style/Language Switches
  const handleRecompile = async (targetCv = cvStructuredData, style = templateStyle, lang = cvLanguage) => {
    if (!targetCv) return;
    setIsRecompiling(true);

    try {
      // 1. Recompile PDF
      const compileRes = await fetch(
        `${BACKEND_URL}/api/v1/compile-json-to-pdf?template_style=${style}&language=${lang}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetCv)
        }
      );

      if (!compileRes.ok) throw new Error('Failed to recompile PDF resume.');

      const blob = await compileRes.blob();
      const newUrl = URL.createObjectURL(blob);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(newUrl);

      // 2. Re-compute ATS Score if Job Description is present
      if (jobDescription && jobDescription.trim()) {
        const scoreRes = await fetch(`${BACKEND_URL}/api/v1/analyze-ats-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv: targetCv, job_description: jobDescription })
        });

        if (scoreRes.ok) {
          const newScore = await scoreRes.json();
          setAtsAnalysis(newScore);
        }
      }
    } catch (err) {
      console.error('Recompile error:', err);
    } finally {
      setIsRecompiling(false);
    }
  };

  // Download Word (.docx) format with style & language
  const handleDownloadDocx = async (style = templateStyle, lang = cvLanguage) => {
    if (!cvStructuredData) {
      alert('Nessun CV generato. Ottimizza prima il tuo CV con l\'AI.');
      return;
    }
    try {
      const filename = pdfFilename ? pdfFilename.replace(/\.pdf$/i, '.docx') : 'Tailored_ATS_Resume.docx';
      const res = await fetch(
        `${BACKEND_URL}/api/v1/compile-json-to-docx?template_style=${style}&language=${lang}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cvStructuredData)
        }
      );
      if (!res.ok) throw new Error('Failed to generate DOCX file.');
      const docxBlob = await res.blob();

      const docxUrl = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = docxUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(docxUrl), 2000);
    } catch (err) {
      alert(`Error downloading Word document: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <FileText size={24} />
          </div>
          <div>
            <div className="brand-title">
              <span className="text-gradient">TailorCraft AI</span>
              <span className="brand-badge">
                <span className="live-pulse-dot" />
                {apiKey ? `${provider.toUpperCase()} Ready` : 'Stateless BYOK'}
              </span>
            </div>
            <div className="brand-subtitle">
              Precision Resume Engineering &bull; Formula Google XYZ &bull; Esportazione PDF & DOCX nativa
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowExtensionHelp(!showExtensionHelp)}
            title="Guida Estensione Chrome"
          >
            <Puzzle size={15} color="#38bdf8" />
            <span>Chrome Extension</span>
          </button>

          <button
            type="button"
            className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Configura provider e chiave API"
          >
            <Settings size={15} />
            <span>BYOK Settings</span>
            {apiKey && <span className="live-pulse-dot" style={{ marginLeft: '4px' }} />}
          </button>
        </div>
      </header>

      {/* EXTENSION HELP MODAL/BANNER */}
      {showExtensionHelp && (
        <div
          className="glass-panel"
          style={{
            marginBottom: '24px',
            padding: '20px 24px',
            background: 'rgba(14, 116, 144, 0.18)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Puzzle size={20} />
                Installazione Estensione Chrome per LinkedIn
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#e0f2fe', marginBottom: '10px' }}>
                Estrai qualsiasi annuncio di lavoro da LinkedIn con 1 click direttamente in quest'app senza scraping bloccato:
              </p>
              <ol style={{ fontSize: '0.84rem', color: '#bae6fd', paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Apri Chrome e vai su <code>chrome://extensions/</code></li>
                <li>Attiva la <strong>Modalità sviluppatore</strong> in alto a destra.</li>
                <li>Clicca su <strong>Carica estensione non pacchettizzata</strong> e seleziona la cartella <code>extension</code> di questo progetto.</li>
                <li>Apri qualsiasi offerta di lavoro su LinkedIn e clicca sull'icona dell'estensione per importare l'annuncio istantaneamente!</li>
              </ol>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              onClick={() => setShowExtensionHelp(false)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* BYOK SETTINGS PANEL */}
      {showSettings && (
        <BYOKSettings
          provider={provider}
          setProvider={setProvider}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={model}
          setModel={setModel}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '14px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.2)'
          }}
        >
          <AlertCircle size={20} color="#ef4444" />
          <div style={{ flex: 1 }}>{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* WIZARD STEPPER NAVIGATION */}
      <div className="wizard-stepper">
        <button
          type="button"
          className={`wizard-step-node ${activeWizardStep === 1 ? 'active' : ''} ${pdfBlobUrl ? 'completed' : ''}`}
          onClick={() => setActiveWizardStep(1)}
        >
          <span className="step-circle" style={{ width: '22px', height: '22px', fontSize: '0.72rem' }}>
            {pdfBlobUrl ? '✓' : '1'}
          </span>
          <span>1. Ingestione Dati (CV & Annuncio)</span>
        </button>

        <div className={`wizard-step-divider ${pdfBlobUrl ? 'active' : ''}`} />

        <button
          type="button"
          className={`wizard-step-node ${activeWizardStep === 2 ? 'active' : ''}`}
          onClick={() => {
            if (pdfBlobUrl || cvStructuredData) {
              setActiveWizardStep(2);
            } else {
              alert("Completa prima il caricamento del CV e dell'annuncio per accedere alla Suite.");
            }
          }}
        >
          <span className="step-circle" style={{ width: '22px', height: '22px', fontSize: '0.72rem' }}>
            2
          </span>
          <span>2. Suite CV Ottimizzato & Audit</span>
          {atsAnalysis && (
            <span className="badge-tag" style={{ marginLeft: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              {atsAnalysis.score}% ATS
            </span>
          )}
        </button>
      </div>

      {/* STEP 1: INPUT CV & JOB DESCRIPTION */}
      {activeWizardStep === 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
            <FileUploadZone file={file} setFile={setFile} />
            <JobDescriptionInput jd={jobDescription} setJd={setJobDescription} />
          </div>

          {isLoading && <LoadingProgress currentStep={currentStep} />}

          {/* STEP 1 PREFERENCES: LANGUAGE & ATS TEMPLATE STYLE */}
          <div
            className="glass-panel"
            style={{
              maxWidth: '680px',
              margin: '0 auto',
              width: '100%',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={18} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  Lingua del CV generato:
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn ${cvLanguage === 'en' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-xs)' }}
                    onClick={() => setCvLanguage('en')}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    className={`btn ${cvLanguage === 'it' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-xs)' }}
                    onClick={() => setCvLanguage('it')}
                  >
                    🇮🇹 Italiano
                  </button>
                </div>
              </div>
            </div>

            {/* Template Style Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Type size={18} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  Stile Tipografico:
                </div>
                <select
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  className="form-control"
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.8rem',
                    background: '#0a0e17',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    color: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <option value="modern">Modern Tech (Arial)</option>
                  <option value="classic">Classic Corporate (Georgia)</option>
                  <option value="executive">Executive Minimal (Calibri)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '680px', margin: '4px auto 0', width: '100%' }}>
            <button
              type="button"
              className="btn-hero-cta"
              onClick={handleTailorCV}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Ottimizzazione AI & Compilazione ATS in corso...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Ottimizza CV per l'Annuncio con Formula XYZ</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: FULL-WIDTH TAILORED CV SUITE & AUDIT */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveWizardStep(1)}
              style={{ gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Torna a Modifica CV & Annuncio</span>
            </button>

            {cvStructuredData?.full_name && (
              <div style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
                Candidato: <strong style={{ color: '#fff' }}>{cvStructuredData.full_name}</strong>
              </div>
            )}
          </div>

          <PdfViewerPanel
            pdfBlobUrl={pdfBlobUrl}
            pdfFilename={pdfFilename}
            cvData={cvStructuredData}
            onChangeCV={setCvStructuredData}
            atsAnalysis={atsAnalysis}
            onDownloadDocx={handleDownloadDocx}
            onReset={() => {
              setPdfBlobUrl(null);
              setAtsAnalysis(null);
              setCvStructuredData(null);
              setActiveWizardStep(1);
            }}
            isLoading={isLoading}
            templateStyle={templateStyle}
            setTemplateStyle={setTemplateStyle}
            cvLanguage={cvLanguage}
            setCvLanguage={setCvLanguage}
            onRecompile={handleRecompile}
            isRecompiling={isRecompiling}
          />
        </div>
      )}
    </div>
  );
}
