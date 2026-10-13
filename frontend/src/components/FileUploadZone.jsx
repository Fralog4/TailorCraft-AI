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
          <UploadCloud size={18} color="#818cf8" />
          <span>Carica CV Originale</span>
        </div>
        <span className="badge-tag">PDF &bull; DOCX &bull; TXT</span>
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
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div className="dropzone-icon">
              <UploadCloud size={26} />
            </div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '6px', color: '#f8fafc' }}>
              Trascina qui il tuo CV oppure clicca
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
              Supporta formati PDF, Word (DOCX) o testo (Max 15MB)
            </p>
            <div>
              <span className="btn btn-secondary" style={{ padding: '7px 18px', fontSize: '0.82rem' }}>
                Sfoglia File dal Computer
              </span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="file-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(59, 130, 246, 0.15))',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
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
