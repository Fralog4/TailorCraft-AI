import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Check, X } from 'lucide-react';

export default function FileUploadZone({ file, setFile }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      setFile(selectedFile);
    } else {
      alert('Please select a valid .pdf, .docx, or .txt resume file.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div className="card-title">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <UploadCloud size={17} />
          </div>
          <span>Carica CV Originale</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>PDF</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>DOCX</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' }}>TXT</span>
        </div>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Seleziona il tuo curriculum vitae attuale. L'AI ne estrarrà fedelmente competenze e percorsi senza allucinazioni.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
        />

        {!file ? (
          <div
            className={`dropzone-container ${isDragOver ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
          >
            <div className="dropzone-icon">
              <UploadCloud size={28} />
            </div>
            <h4 style={{ fontSize: '1.02rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              Trascina qui il tuo CV oppure clicca
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '16px', maxWidth: '300px' }}>
              Analisi sicura in locale dei formati PDF, DOCX e TXT fino a 15MB
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '8px 20px',
                fontSize: '0.84rem',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
              }}
            >
              Sfoglia File dal Computer
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 20, 36, 0.85) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.15))',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399'
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <Check size={13} />
                    <span>{formatFileSize(file.size)} &bull; Pronto per l'ottimizzazione ATS</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '7px', borderRadius: '50%', color: '#94a3b8' }}
                onClick={() => setFile(null)}
                title="Rimuovi file"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                Sostituisci con un altro file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
