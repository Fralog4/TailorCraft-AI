import React, { useMemo, useState } from 'react';
import { Briefcase, Trash2, CheckCircle2, Wand2, AlertTriangle, Clipboard, Check } from 'lucide-react';

export function cleanLinkedInRawText(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText;

  // Search for the start of the job details section
  const headerMatch = rawText.match(/(?:Informazioni sull['’]offerta di lavoro|About the job)/i);
  if (!headerMatch) {
    return rawText;
  }

  const jobBodyStartIndex = headerMatch.index;
  // Look backwards for possible Job Title and Company
  const preHeaderText = rawText.slice(Math.max(0, jobBodyStartIndex - 800), jobBodyStartIndex);
  let extractedHeader = "";

  const actionBtnIndex = preHeaderText.search(/(?:Salva\s+Candidati|Candidati\s+Salva)/i);
  if (actionBtnIndex !== -1) {
    const linesBeforeBtn = preHeaderText
      .slice(0, actionBtnIndex)
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.includes('risultati') && !l.includes('Visualizzata'));

    if (linesBeforeBtn.length >= 2) {
      const companyLine = linesBeforeBtn[linesBeforeBtn.length - 1].replace(/•.*$/, '').trim();
      const titleLine = linesBeforeBtn[linesBeforeBtn.length - 2].trim();
      if (titleLine && companyLine) {
        extractedHeader = `Job Title: ${titleLine}\nCompany: ${companyLine}\n---\n\n`;
      }
    }
  }

  // Slice body after the heading
  const bodyAfterHeader = rawText.slice(jobBodyStartIndex + headerMatch[0].length);
  const endMatch = bodyAfterHeader.match(
    /(?:Informazioni sull['’]azienda|About the company|Cerca lavoro in modo pi[uù] veloce con Premium|Vorresti lavorare con noi in futuro\?|Segnala quest['’]offerta|Report this job|Visualizza altro)/i
  );

  let cleanBody = endMatch ? bodyAfterHeader.slice(0, endMatch.index) : bodyAfterHeader;
  cleanBody = cleanBody.replace(/\s*(Show less|Mostra meno)[\s\S]*$/i, '').replace(/…\s*altro\s*$/i, '').trim();

  return (extractedHeader + cleanBody).trim();
}

export default function JobDescriptionInput({ jd, setJd }) {
  const [copied, setCopied] = useState(false);
  const charCount = jd.length;
  const wordCount = jd.trim() ? jd.trim().split(/\s+/).length : 0;

  // Detect if text contains full LinkedIn page garbage
  const hasPageClutter = useMemo(() => {
    if (!jd || jd.length < 300) return false;
    return (
      /Offerte di lavoro in base alle tue preferenze|risultati\s*·|LinkedIn Corporation/i.test(jd) &&
      /Informazioni sull['’]offerta di lavoro|About the job/i.test(jd)
    );
  }, [jd]);

  const handleCleanText = () => {
    const cleaned = cleanLinkedInRawText(jd);
    setJd(cleaned);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJd(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div className="card-title">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <Briefcase size={17} />
          </div>
          <span>Job Description Target</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={13} color="#34d399" />
            <span>Extension Ready</span>
          </span>
          {jd ? (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)' }}
              onClick={() => setJd('')}
              title="Cancella testo"
            >
              <Trash2 size={13} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(56, 189, 248, 0.3)' }}
              onClick={handlePasteClipboard}
              title="Incolla testo dagli appunti"
            >
              {copied ? <Check size={12} color="#34d399" /> : <Clipboard size={12} color="#38bdf8" />}
              <span>{copied ? 'Incollato!' : 'Incolla dagli Appunti'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
          Incolla l'annuncio LinkedIn desiderato o usa l'<strong>Estensione Chrome</strong> per estrarlo con 1 click senza formattazioni superflue.
        </p>

        {hasPageClutter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '14px',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#fbbf24' }}>
              <AlertTriangle size={18} />
              <span>Rilevata intera pagina di ricerca (25+ annunci). Vuoi isolare solo l'annuncio selezionato?</span>
            </div>
            <button
              type="button"
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                backgroundColor: '#d97706',
                color: '#fff',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)'
              }}
              onClick={handleCleanText}
            >
              <Wand2 size={13} />
              <span>Isola Annuncio Singolo</span>
            </button>
          </div>
        )}

        {/* The textarea MUST have id="jd-input" as specified in the blueprint */}
        <textarea
          id="jd-input"
          className="form-control"
          rows={11}
          style={{ flex: 1, minHeight: '220px' }}
          placeholder="Incolla qui la Job Description completa o catturala in automatico da LinkedIn con l'estensione..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge-tag" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
              {wordCount} parole
            </span>
            <span className="badge-tag" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-dim)' }}>
              {charCount} caratteri
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {wordCount >= 60 && (
              <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} />
                Annuncio pronto
              </span>
            )}
            {jd && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.76rem', gap: '6px' }}
                onClick={handleCleanText}
                title="Pulisce elementi superflui e isola la descrizione dell'annuncio"
              >
                <Wand2 size={12} color="#38bdf8" />
                <span>Pulisci Annuncio LinkedIn</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
