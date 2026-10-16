import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, AlertTriangle, Sparkles, TrendingUp, Check, X, ArrowUpRight } from 'lucide-react';

export default function ATSScoreCard({ atsAnalysis, onBoost, isBoosting = false }) {
  if (!atsAnalysis) return null;

  const { score, match_level, matched_keywords = [], missing_keywords = [], analysis_summary } = atsAnalysis;

  // Track which missing keywords the user wants to infuse (all selected by default)
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  useEffect(() => {
    if (missing_keywords && missing_keywords.length > 0) {
      setSelectedKeywords([...missing_keywords]);
    } else {
      setSelectedKeywords([]);
    }
  }, [missing_keywords]);

  const toggleKeyword = (kw) => {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeywords([...missing_keywords]);
  };

  const handleDeselectAll = () => {
    setSelectedKeywords([]);
  };

  // Determine score color
  const getScoreColor = (val) => {
    if (val >= 85) return '#10b981'; // emerald
    if (val >= 70) return '#3b82f6'; // blue
    return '#f59e0b'; // amber
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      className="glass-panel"
      style={{
        marginTop: '16px',
        padding: '22px 24px',
        border: `1px solid ${scoreColor}45`,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 16, 30, 0.95) 100%)',
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px ${scoreColor}15`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: `${scoreColor}18`,
              border: `1px solid ${scoreColor}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: scoreColor,
              boxShadow: `0 0 16px ${scoreColor}25`
            }}
          >
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              ATS Match Score
            </div>
            <div style={{ fontSize: '0.82rem', color: scoreColor, fontWeight: 700, letterSpacing: '0.01em' }}>
              {match_level}
            </div>
          </div>
        </div>

        {/* Circular / Badge score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '3px',
            padding: '7px 16px',
            borderRadius: '9999px',
            backgroundColor: `${scoreColor}18`,
            border: `1px solid ${scoreColor}50`,
            boxShadow: `0 0 20px ${scoreColor}25`
          }}
        >
          <span style={{ fontSize: '1.55rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: scoreColor }}>%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '16px',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: scoreColor,
            borderRadius: '9999px',
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 0 12px ${scoreColor}`
          }}
        />
      </div>

      <p style={{ fontSize: '0.86rem', color: '#cbd5e1', marginBottom: '18px', lineHeight: 1.55 }}>
        {analysis_summary}
      </p>

      {/* Matched Keywords */}
      {matched_keywords.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Infused JD Keywords ({matched_keywords.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {matched_keywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  fontWeight: 500
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing / Additional Opportunities & 1-Click AI Boost */}
      {missing_keywords.length > 0 && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} color="#f59e0b" />
              <span>Recommended Additional Keywords ({missing_keywords.length})</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0 }}
              >
                Seleziona tutte
              </button>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                Deseleziona
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '10px', lineHeight: 1.4 }}>
            Seleziona le keyword pertinenti che vuoi integrare nel CV per massimizzare il matching ATS:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {missing_keywords.map((kw, i) => {
              const isSelected = selectedKeywords.includes(kw);
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleKeyword(kw)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#fde68a' : '#94a3b8',
                    border: `1px solid ${isSelected ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isSelected ? "Clicca per escludere" : "Clicca per includere"}
                >
                  {isSelected ? <Check size={11} color="#fbbf24" /> : <span style={{ opacity: 0.5 }}>+</span>}
                  <span>{kw}</span>
                </button>
              );
            })}
          </div>

          {/* AI REFORMULATION ACTION BUTTON */}
          {onBoost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => onBoost(selectedKeywords)}
                disabled={isBoosting || selectedKeywords.length === 0}
                style={{
                  background: selectedKeywords.length === 0
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  boxShadow: selectedKeywords.length === 0 ? 'none' : '0 4px 18px rgba(16, 185, 129, 0.35)',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: selectedKeywords.length === 0 || isBoosting ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {isBoosting ? (
                  <>
                    <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                    <span>Integrazione Keyword & Riformulazione Formula XYZ in corso...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Riformula CV con queste Keyword (+Score ATS)</span>
                    <ArrowUpRight size={15} />
                  </>
                )}
              </button>

              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {selectedKeywords.length} keyword selezionate per l'infusione AI
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
