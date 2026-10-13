import React from 'react';
import { Target, CheckCircle2, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

export default function ATSScoreCard({ atsAnalysis }) {
  if (!atsAnalysis) return null;

  const { score, match_level, matched_keywords = [], missing_keywords = [], analysis_summary } = atsAnalysis;

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
        padding: '18px 20px',
        border: `1px solid ${scoreColor}40`,
        background: 'rgba(15, 23, 42, 0.75)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: `${scoreColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: scoreColor
            }}
          >
            <Target size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              ATS Match Score
            </div>
            <div style={{ fontSize: '0.78rem', color: scoreColor, fontWeight: 600 }}>
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
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: `${scoreColor}18`,
            border: `1px solid ${scoreColor}50`
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: scoreColor }}>%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '14px'
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            backgroundColor: scoreColor,
            borderRadius: '9999px',
            transition: 'width 0.8s ease'
          }}
        />
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
        {analysis_summary}
      </p>

      {/* Matched Keywords */}
      {matched_keywords.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} color="#10b981" />
            <span>Infused JD Keywords ({matched_keywords.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {matched_keywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontWeight: 500
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing / Additional Opportunities */}
      {missing_keywords.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} color="#f59e0b" />
            <span>Recommended Additional Keywords</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {missing_keywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontWeight: 500
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
