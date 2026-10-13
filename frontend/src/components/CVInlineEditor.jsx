import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

// Common action verbs in English and Italian
const ACTION_VERBS = new Set([
  // English action verbs
  'architected', 'spearheaded', 'engineered', 'optimized', 'developed',
  'implemented', 'designed', 'built', 'orchestrated', 'automated', 'scaled',
  'reduced', 'increased', 'accelerated', 'led', 'delivered', 'refactored',
  'deployed', 'launched', 'improved', 'cut', 'slashed', 'created', 'resolved',
  // Italian action verbs
  'sviluppato', 'ingegnerizzato', 'ottimizzato', 'progettato', 'implementato',
  'guidato', 'coordinato', 'ridotto', 'incrementato', 'accelerato', 'automatizzato',
  'scalato', 'architettato', 'rilasciato', 'creato', 'migliorato', 'risolto'
]);

function analyzeBulletXYZ(text) {
  if (!text || text.trim().length === 0) return { score: 'empty', msg: 'Punto vuoto' };

  const trimmed = text.trim();
  const firstWord = trimmed.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
  const hasActionVerb = ACTION_VERBS.has(firstWord);

  // Check for numbers or metrics (%, $, €, ms, k, x, ore, giorni)
  const hasMetric = /\b\d+(\.\d+)?%?|\b\d+k\b|\b\d+x\b|(\$|€)\s*\d+|\b\d+\s*(ms|secondi|minuti|ore|giorni|volte|percento)\b/i.test(trimmed);

  if (hasActionVerb && hasMetric) {
    return {
      status: 'excellent',
      badge: '✓ Formula Google XYZ Rispettata',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      tip: 'Ottimo lavoro! Include sia verbo d’azione forte che metrica quantificata.'
    };
  } else if (hasActionVerb && !hasMetric) {
    return {
      status: 'good',
      badge: '⚠️ Manca Metrica Quantificata (Y)',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      tip: 'Inizia con un buon verbo d’azione. Suggerimento: aggiungi una stima quantitativa (es. "riducendo la latenza del 25%", "gestendo 10k richieste/giorno").'
    };
  } else if (!hasActionVerb && hasMetric) {
    return {
      status: 'warning',
      badge: '⚠️ Inizia con un Verbo d’Azione (X)',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      tip: 'Contiene metriche, ma dovrebbe iniziare con un verbo d’azione al passato forte (es. "Sviluppato", "Ottimizzato", "Architettato").'
    };
  } else {
    return {
      status: 'needs-work',
      badge: '💡 Suggerimento XYZ',
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)',
      tip: 'Formula Google consigliata: "Raggiunto [X] misurato da [Y], facendo [Z]". Esempio: "Ottimizzato il database (Z), riducendo i tempi di caricamento del 40% (Y) per 50.000 utenti (X)".'
    };
  }
}

export default function CVInlineEditor({ cvData, onChangeCV, onRecompile, isRecompiling }) {
  const [activeHintIndex, setActiveHintIndex] = useState(null);

  if (!cvData) return null;

  const handleFieldChange = (field, value) => {
    onChangeCV({ ...cvData, [field]: value });
  };

  const handleSkillChange = (idx, value) => {
    const updated = [...cvData.skills];
    updated[idx] = value;
    onChangeCV({ ...cvData, skills: updated });
  };

  const handleAddSkill = () => {
    onChangeCV({ ...cvData, skills: [...cvData.skills, 'Nuova competenza'] });
  };

  const handleRemoveSkill = (idx) => {
    const updated = cvData.skills.filter((_, i) => i !== idx);
    onChangeCV({ ...cvData, skills: updated });
  };

  // Experience Handlers
  const handleExpChange = (expIdx, field, value) => {
    const updatedExps = [...cvData.experiences];
    updatedExps[expIdx] = { ...updatedExps[expIdx], [field]: value };
    onChangeCV({ ...cvData, experiences: updatedExps });
  };

  const handleBulletChange = (expIdx, bulletIdx, value) => {
    const updatedExps = [...cvData.experiences];
    const updatedBullets = [...updatedExps[expIdx].bullet_points];
    updatedBullets[bulletIdx] = value;
    updatedExps[expIdx] = { ...updatedExps[expIdx], bullet_points: updatedBullets };
    onChangeCV({ ...cvData, experiences: updatedExps });
  };

  const handleAddBullet = (expIdx) => {
    const updatedExps = [...cvData.experiences];
    updatedExps[expIdx] = {
      ...updatedExps[expIdx],
      bullet_points: [...updatedExps[expIdx].bullet_points, 'Ottimizzato [processo], raggiungendo [risultato] tramite [tecnologia].']
    };
    onChangeCV({ ...cvData, experiences: updatedExps });
  };

  const handleRemoveBullet = (expIdx, bulletIdx) => {
    const updatedExps = [...cvData.experiences];
    updatedExps[expIdx] = {
      ...updatedExps[expIdx],
      bullet_points: updatedExps[expIdx].bullet_points.filter((_, i) => i !== bulletIdx)
    };
    onChangeCV({ ...cvData, experiences: updatedExps });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Banner with Recompile Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div>
          <div style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span>Editor Interattivo CV con Google XYZ Enhancer</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Modifica qualsiasi campo; clicca su "Aggiorna Anteprima" per ricompilare il PDF e ricalcolare l'ATS Score.
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
          onClick={onRecompile}
          disabled={isRecompiling}
        >
          <RefreshCw size={13} className={isRecompiling ? 'spin' : ''} />
          <span>{isRecompiling ? 'Aggiornamento...' : 'Aggiorna Anteprima Live'}</span>
        </button>
      </div>

      {/* 1. Candidate Info */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
          Dati Candidato & Contatti
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nome Completo</label>
            <input
              type="text"
              className="form-control"
              value={cvData.full_name || ''}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contatti (Email | Telefono | Città | LinkedIn)</label>
            <input
              type="text"
              className="form-control"
              value={cvData.contact_info || ''}
              onChange={(e) => handleFieldChange('contact_info', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Professional Summary */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
          Profilo Professionale (Summary)
        </h4>
        <textarea
          className="form-control"
          rows={3}
          value={cvData.professional_summary || ''}
          onChange={(e) => handleFieldChange('professional_summary', e.target.value)}
        />
      </div>

      {/* 3. Core Skills */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
            Competenze & Tecnologie
          </h4>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
            onClick={handleAddSkill}
          >
            <Plus size={12} />
            <span>Aggiungi Gruppo Skill</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {cvData.skills?.map((skill, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                value={skill}
                onChange={(e) => handleSkillChange(idx, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '6px', color: '#ef4444' }}
                onClick={() => handleRemoveSkill(idx)}
                title="Rimuovi riga competenza"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Experiences with Google XYZ Analyzer */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
          Esperienze Lavorative & Analisi XYZ Bullet Points
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {cvData.experiences?.map((exp, expIdx) => (
            <div
              key={expIdx}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Job Title and Company Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ruolo / Titolo</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                    value={exp.job_title}
                    onChange={(e) => handleExpChange(expIdx, 'job_title', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Azienda</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                    value={exp.company}
                    onChange={(e) => handleExpChange(expIdx, 'company', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Inizio</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                    value={exp.start_date}
                    onChange={(e) => handleExpChange(expIdx, 'start_date', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fine</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                    value={exp.end_date}
                    onChange={(e) => handleExpChange(expIdx, 'end_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Bullet Points with XYZ Quality Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: '600' }}>
                    Risultati & Risoluzioni (Google XYZ Impact):
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', gap: '4px' }}
                    onClick={() => handleAddBullet(expIdx)}
                  >
                    <Plus size={11} />
                    <span>Aggiungi Risultato</span>
                  </button>
                </div>

                {exp.bullet_points?.map((bullet, bIdx) => {
                  const key = `${expIdx}-${bIdx}`;
                  const xyz = analyzeBulletXYZ(bullet);
                  const isHintOpen = activeHintIndex === key;

                  return (
                    <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <textarea
                          className="form-control"
                          rows={2}
                          style={{ fontSize: '0.8rem', lineHeight: '1.35', flex: 1 }}
                          value={bullet}
                          onChange={(e) => handleBulletChange(expIdx, bIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{
                            padding: '6px 8px',
                            color: xyz.color,
                            borderColor: xyz.color,
                            backgroundColor: xyz.bg
                          }}
                          onClick={() => setActiveHintIndex(isHintOpen ? null : key)}
                          title="Mostra analisi impatto formula Google XYZ"
                        >
                          <Lightbulb size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px', color: '#ef4444' }}
                          onClick={() => handleRemoveBullet(expIdx, bIdx)}
                          title="Rimuovi bullet point"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Micro Badge indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: xyz.color,
                            backgroundColor: xyz.bg,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '500'
                          }}
                        >
                          {xyz.badge}
                        </span>
                      </div>

                      {/* Expandable XYZ Suggestion Box */}
                      {isHintOpen && (
                        <div
                          style={{
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            border: `1px solid ${xyz.color}`,
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '0.76rem',
                            color: '#e2e8f0',
                            marginTop: '2px'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: xyz.color, marginBottom: '2px' }}>
                            Suggerimento Metodologia Google XYZ:
                          </div>
                          <div>{xyz.tip}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
