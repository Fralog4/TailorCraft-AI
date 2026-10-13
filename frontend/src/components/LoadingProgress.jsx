import React from 'react';
import { CheckCircle2, Loader2, Sparkles, FileText, Cpu, Printer } from 'lucide-react';

export default function LoadingProgress({ currentStep }) {
  // Step 1: Parsing, Step 2: AI Rewriting, Step 3: Generating PDF
  const steps = [
    {
      id: 1,
      title: 'Parsing Original Document',
      desc: 'Extracting text and structure from PDF/DOCX',
      icon: FileText
    },
    {
      id: 2,
      title: 'AI Rewriting CV with ATS Keywords',
      desc: 'Infusing exact JD terminology & strong action verbs (Zero hallucinations)',
      icon: Cpu
    },
    {
      id: 3,
      title: 'Compiling ATS Single-Column PDF',
      desc: 'Rendering clean typography and strict single-column layout',
      icon: Printer
    }
  ];

  return (
    <div className="steps-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={16} color="#60a5fa" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
          ATS Optimization Pipeline in Progress
        </span>
      </div>

      {steps.map((s) => {
        const isCompleted = currentStep > s.id;
        const isActive = currentStep === s.id;
        const IconComponent = s.icon;

        return (
          <div
            key={s.id}
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? (
                <CheckCircle2 size={16} color="#10b981" />
              ) : isActive ? (
                <Loader2 size={14} className="spinner" />
              ) : (
                s.id
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: isActive ? 600 : 500 }}>
                {s.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                {s.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
