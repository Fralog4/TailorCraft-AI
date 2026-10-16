import React, { useState } from 'react';
import {
  Download,
  FileCheck,
  Eye,
  Code,
  FileText,
  Sparkles,
  Edit3,
  ShieldCheck,
  BarChart3,
  Type,
  Globe
} from 'lucide-react';
import ATSScoreCard from './ATSScoreCard';
import CVInlineEditor from './CVInlineEditor';
import ATSPreFlightAudit from './ATSPreFlightAudit';

export default function PdfViewerPanel({
  pdfBlobUrl,
  pdfFilename,
  cvData,
  onChangeCV,
  atsAnalysis,
  onDownloadDocx,
  onReset,
  isLoading,
  templateStyle,
  setTemplateStyle,
  cvLanguage,
  setCvLanguage,
  onRecompile,
  isRecompiling,
  onBoostKeywords,
  isBoosting
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'editor' | 'audit' | 'keywords' | 'json'

  const docxFilename = pdfFilename ? pdfFilename.replace(/\.pdf$/i, '.docx') : 'Tailored_ATS_Resume.docx';

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="card-title">
          <FileCheck size={18} color="#10b981" />
          <span>Tailored ATS Resume Suite</span>
        </div>

        {/* Global Controls & Downloads */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Style Selector */}
          <div className="custom-select-wrap">
            <Type size={13} color="#94a3b8" />
            <select
              value={templateStyle}
              onChange={(e) => {
                setTemplateStyle(e.target.value);
                if (onRecompile) onRecompile(cvData, e.target.value, cvLanguage);
              }}
              title="Seleziona stile tipografico ATS"
            >
              <option value="modern" style={{ background: '#0a0e17' }}>Modern Tech (Arial)</option>
              <option value="classic" style={{ background: '#0a0e17' }}>Classic Corporate (Georgia)</option>
              <option value="executive" style={{ background: '#0a0e17' }}>Executive Minimal (Calibri)</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="custom-select-wrap">
            <Globe size={13} color="#94a3b8" />
            <select
              value={cvLanguage}
              onChange={(e) => {
                setCvLanguage(e.target.value);
                if (onRecompile) onRecompile(cvData, templateStyle, e.target.value);
              }}
              title="Seleziona lingua delle intestazioni e sezioni"
            >
              <option value="en" style={{ background: '#0a0e17' }}>🇬🇧 English</option>
              <option value="it" style={{ background: '#0a0e17' }}>🇮🇹 Italiano</option>
            </select>
          </div>

          {pdfBlobUrl && (
            <>
              {/* Download Word (.docx) */}
              <button
                type="button"
                onClick={() => onDownloadDocx(templateStyle, cvLanguage)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
                title="Scarica in formato Microsoft Word (.docx)"
              >
                <FileText size={13} color="#60a5fa" />
                <span>Word (.docx)</span>
              </button>

              {/* Download PDF */}
              <a
                href={pdfBlobUrl}
                download={pdfFilename || 'Tailored_ATS_Resume.pdf'}
                className="btn btn-success"
                style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
              >
                <Download size={14} />
                <span>Scarica PDF</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      {pdfBlobUrl && (
        <div
          style={{
            display: 'flex',
            background: 'rgba(10, 14, 22, 0.7)',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="segmented-tabs">
            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={13} />
              <span>Anteprima PDF</span>
            </button>

            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <Edit3 size={13} color="#38bdf8" />
              <span>Editor Live & XYZ</span>
            </button>

            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <ShieldCheck size={13} color="#34d399" />
              <span>Pre-Flight Audit</span>
            </button>

            {atsAnalysis && (
              <button
                type="button"
                className={`segmented-tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
                onClick={() => setActiveTab('keywords')}
              >
                <BarChart3 size={13} color="#f59e0b" />
                <span>Keyword Score ({atsAnalysis.score}%)</span>
              </button>
            )}

            <button
              type="button"
              className={`segmented-tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <Code size={13} />
              <span>Dati JSON</span>
            </button>
          </div>

          {onReset && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              onClick={onReset}
              title="Cancella risultati correnti"
            >
              Nuova Ottimizzazione
            </button>
          )}
        </div>
      )}

      {/* Main Container Body */}
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {!pdfBlobUrl ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileCheck size={36} />
            </div>
            <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: '8px' }}>
              In Attesa di Generazione con l'AI
            </h3>
            <p style={{ maxWidth: '460px', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              Il CV su misura non è ancora stato compilato. Segui i passaggi per avviare il motore neurale ATS:
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'left',
                backgroundColor: 'rgba(8, 12, 20, 0.75)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                maxWidth: '440px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div><strong style={{ color: '#818cf8' }}>1.</strong> Carica il tuo CV originale a sinistra (PDF o Word).</div>
              <div><strong style={{ color: '#38bdf8' }}>2.</strong> Incolla l'annuncio LinkedIn (o usa l'estensione Chrome).</div>
              <div><strong style={{ color: '#34d399' }}>3.</strong> Verifica la tua API Key in <strong>BYOK Settings</strong> (⚙️ in alto).</div>
              <div><strong style={{ color: '#f43f5e' }}>4.</strong> Clicca sul pulsante <strong>Tailor CV to Job Description</strong>.</div>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="pdf-viewer-wrap" style={{ flex: 1, minHeight: '620px' }}>
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                title="Tailored ATS Resume Preview"
                style={{ width: '100%', height: '100%', minHeight: '620px', border: 'none' }}
              />
            </div>
            {atsAnalysis && (
              <ATSScoreCard
                atsAnalysis={atsAnalysis}
                onBoost={onBoostKeywords}
                isBoosting={isBoosting}
              />
            )}
          </div>
        ) : activeTab === 'editor' ? (
          <CVInlineEditor
            cvData={cvData}
            onChangeCV={onChangeCV}
            onRecompile={() => onRecompile(cvData, templateStyle, cvLanguage)}
            isRecompiling={isRecompiling}
          />
        ) : activeTab === 'audit' ? (
          <ATSPreFlightAudit
            cvData={cvData}
            atsScore={atsAnalysis?.score || 85}
          />
        ) : activeTab === 'keywords' ? (
          <div>
            {atsAnalysis && (
              <ATSScoreCard
                atsAnalysis={atsAnalysis}
                onBoost={onBoostKeywords}
                isBoosting={isBoosting}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              background: 'rgba(13, 17, 28, 0.9)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              overflowY: 'auto',
              maxHeight: '660px',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#93c5fd'
            }}
          >
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(cvData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
