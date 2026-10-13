import React, { useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mail,
  Phone,
  Link,
  TrendingUp,
  FileText,
  Sparkles
} from 'lucide-react';

// Cliche buzzwords that ATS experts recommend avoiding
const BUZZWORDS = [
  'hard-working', 'hardworking', 'team player', 'rockstar', 'guru', 'ninja',
  'problem solver', 'go-getter', 'fast learner', 'detail-oriented', 'think outside the box',
  'dinamico', 'appassionato', 'perfezionista', 'entusiasta', 'automotivato',
  'flessibile', 'buone doti relazionali', 'orientato agli obiettivi'
];

export default function ATSPreFlightAudit({ cvData, atsScore }) {
  const audit = useMemo(() => {
    if (!cvData) return null;

    const contactStr = (cvData.contact_info || '').toLowerCase();
    const allText = [
      cvData.full_name,
      cvData.contact_info,
      cvData.professional_summary,
      ...(cvData.skills || []),
      ...(cvData.experiences?.flatMap(e => [e.job_title, e.company, ...(e.bullet_points || [])]) || []),
      ...(cvData.education?.flatMap(e => [e.degree, e.institution]) || [])
    ].join(' ').toLowerCase();

    // 1. Contact Info Checks
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(contactStr);
    const hasPhone = /\+?\d[\d\s\-\(\)]{7,}\d/.test(contactStr);
    const hasLinkedIn = contactStr.includes('linkedin.com') || contactStr.includes('linkedin');
    const hasLocation = contactStr.includes('|') || contactStr.length > 20;

    // 2. Word Count & Page Budget
    const wordCount = allText.trim().split(/\s+/).length;
    let pageStatus = 'optimal-1';
    let pageMsg = '';

    if (wordCount <= 460) {
      pageStatus = 'optimal-1';
      pageMsg = `Circa ${wordCount} parole — Lunghezza ideale per 1 pagina singola ATS senza righe orfane.`;
    } else if (wordCount > 460 && wordCount <= 620) {
      pageStatus = 'warning-overflow';
      pageMsg = `Circa ${wordCount} parole — Rischio pagina orfana (1 pagina e poche righe nella seconda). Consigliato ridurre ~50 parole o espandere a 2 pagine piene.`;
    } else if (wordCount > 620 && wordCount <= 920) {
      pageStatus = 'optimal-2';
      pageMsg = `Circa ${wordCount} parole — Ben bilanciato per 2 pagine standard (ideale per profili senior).`;
    } else {
      pageStatus = 'warning-length';
      pageMsg = `Circa ${wordCount} parole — Molto lungo per gli standard ATS. Consigliato sintetizzare per non superare 2 pagine.`;
    }

    // 3. Google XYZ Impact & Action Verbs
    const allBullets = cvData.experiences?.flatMap(e => e.bullet_points || []) || [];
    let bulletsWithMetrics = 0;
    allBullets.forEach(b => {
      if (/\b\d+(\.\d+)?%?|\b\d+k\b|\b\d+x\b|(\$|€)\s*\d+|\b\d+\s*(ms|secondi|minuti|ore|giorni|volte|percento)\b/i.test(b)) {
        bulletsWithMetrics++;
      }
    });

    const metricPercentage = allBullets.length > 0 ? Math.round((bulletsWithMetrics / allBullets.length) * 100) : 0;

    // 4. Zero-Buzzword Filter
    const foundBuzzwords = [];
    BUZZWORDS.forEach(bw => {
      const regex = new RegExp(`\\b${bw}\\b`, 'i');
      if (regex.test(allText)) {
        foundBuzzwords.push(bw);
      }
    });

    // 5. Structure & Single Column
    const isSingleColumn = true; // Always enforced by our templates

    // Overall Readiness Score (0 - 100)
    let readinessScore = 60;
    if (hasEmail) readinessScore += 10;
    if (hasPhone) readinessScore += 10;
    if (hasLinkedIn) readinessScore += 5;
    if (pageStatus.startsWith('optimal')) readinessScore += 10;
    if (foundBuzzwords.length === 0) readinessScore += 5;

    return {
      hasEmail,
      hasPhone,
      hasLinkedIn,
      hasLocation,
      wordCount,
      pageStatus,
      pageMsg,
      allBulletsCount: allBullets.length,
      bulletsWithMetrics,
      metricPercentage,
      foundBuzzwords,
      isSingleColumn,
      readinessScore: Math.min(100, readinessScore)
    };
  }, [cvData]);

  if (!audit) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Audit Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={24} color="#34d399" />
          <div>
            <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.95rem' }}>
              ATS Pre-Flight Audit Checklist
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Analisi di conformità tecnica prima dell'invio della candidatura.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Indice Idoneità</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: audit.readinessScore >= 85 ? '#34d399' : '#fbbf24' }}>
            {audit.readinessScore}%
          </div>
        </div>
      </div>

      {/* Checklist Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        {/* 1. Contact Integrity */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={15} color="#60a5fa" />
              <span>1. Informazioni di Contatto & Recapiti</span>
            </span>
            {audit.hasEmail && audit.hasPhone ? (
              <span style={{ color: '#34d399', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Conforme
              </span>
            ) : (
              <span style={{ color: '#f59e0b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Attenzione
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ color: audit.hasEmail ? '#34d399' : '#ef4444' }}>
              {audit.hasEmail ? '✓ Email Riconosciuta' : '✗ Email mancante'}
            </span>
            <span>&bull;</span>
            <span style={{ color: audit.hasPhone ? '#34d399' : '#f59e0b' }}>
              {audit.hasPhone ? '✓ Telefono Presente' : '✗ Telefono non rilevato'}
            </span>
            <span>&bull;</span>
            <span style={{ color: audit.hasLinkedIn ? '#34d399' : '#94a3b8' }}>
              {audit.hasLinkedIn ? '✓ Profilo LinkedIn' : '○ LinkedIn Opzionale'}
            </span>
          </div>
        </div>

        {/* 2. Google XYZ Impact Metrics */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} color="#a78bfa" />
              <span>2. Copertura Metriche Quantificate (Formula Google XYZ)</span>
            </span>
            <span style={{ color: audit.metricPercentage >= 60 ? '#34d399' : '#f59e0b', fontSize: '0.78rem', fontWeight: 'bold' }}>
              {audit.metricPercentage}% dei Bullet Point
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {audit.bulletsWithMetrics} su {audit.allBulletsCount} punti includono numeri, percentuali o tempi di impatto.
            {audit.metricPercentage < 60 && ' Consigliato arricchire i punti deboli con stime numeriche nell’Editor.'}
          </p>
        </div>

        {/* 3. Page Budget & Overflow Risk */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#38bdf8" />
              <span>3. Controllo Lunghezza & Budget Pagine ATS</span>
            </span>
            {audit.pageStatus.startsWith('optimal') ? (
              <span style={{ color: '#34d399', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Ottimale
              </span>
            ) : (
              <span style={{ color: '#f59e0b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Rischio Paginazione
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {audit.pageMsg}
          </p>
        </div>

        {/* 4. Zero-Buzzword Filter */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="#f43f5e" />
              <span>4. Filtro Zero-Buzzword (Aggettivi Generici Senza Fatti)</span>
            </span>
            {audit.foundBuzzwords.length === 0 ? (
              <span style={{ color: '#34d399', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Nessun Cliché
              </span>
            ) : (
              <span style={{ color: '#ef4444', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={14} /> {audit.foundBuzzwords.length} Rilevati
              </span>
            )}
          </div>
          {audit.foundBuzzwords.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Ottimo! Il tuo CV usa fatti e competenze oggettive invece di slogan autocelebrativi.
            </p>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
              Trovate parole vuote non dimostrabili: <strong>{audit.foundBuzzwords.join(', ')}</strong>. Sostituiscile con azioni concrete.
            </div>
          )}
        </div>

        {/* 5. ATS Layout Hierarchy */}
        <div className="glass-panel" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>5. Layout Singola Colonna Standard</span>
            </span>
            <span style={{ color: '#34d399', fontSize: '0.78rem' }}>100% Garantito</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Layout lineare certificato senza tabelle annidate o colonne laterali, pienamente scansionabile da qualsiasi parser ATS.
          </p>
        </div>
      </div>
    </div>
  );
}
