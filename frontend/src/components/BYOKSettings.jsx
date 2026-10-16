import React, { useState } from 'react';
import { Key, Eye, EyeOff, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';

export const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-3.8-flash',
    docUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSy...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    docUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-20241022',
    docUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...'
  },
  {
    id: 'groq',
    name: 'Groq (Ultra-fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    docUrl: 'https://console.groq.com/keys',
    placeholder: 'gsk_...'
  }
];

export default function BYOKSettings({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  model,
  setModel,
  isOpen,
  onClose
}) {
  const [showKey, setShowKey] = useState(false);

  const currentProviderObj = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  return (
    <div className="glass-panel" style={{ marginBottom: '24px', borderColor: 'rgba(99, 102, 241, 0.4)', boxShadow: '0 12px 35px rgba(99, 102, 241, 0.15)' }}>
      <div className="card-header" style={{ background: 'rgba(99, 102, 241, 0.08)' }}>
        <div className="card-title">
          <Key size={18} color="#818cf8" />
          <span>Configurazione Chiave AI (BYOK - Bring Your Own Key)</span>
          <span className="brand-badge" style={{ marginLeft: '8px' }}>
            <ShieldCheck size={12} />
            Privato & Stateless
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={currentProviderObj.docUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <span>Ottieni Chiave {currentProviderObj.name}</span>
            <ExternalLink size={13} />
          </a>
          {onClose && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={onClose}
            >
              Salva & Chiudi
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
          La tua chiave API non viene <strong>mai</strong> registrata sui nostri server: risiede esclusivamente nella memoria del tuo browser per inviare le richieste di ottimizzazione del CV in forma stateless.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
          <div>
            <label className="input-label">Provider di Intelligenza Artificiale</label>
            <select
              className="form-control"
              value={provider}
              onChange={(e) => {
                const nextP = e.target.value;
                setProvider(nextP);
                const found = PROVIDERS.find(p => p.id === nextP);
                if (found) setModel(found.defaultModel);
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#0a0e17' }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Identificatore Modello (LLM Model)</label>
            <input
              type="text"
              className="form-control"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={currentProviderObj.defaultModel}
            />
          </div>
        </div>

        <div>
          <label className="input-label">
            Chiave Segreta API per {currentProviderObj.name}
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="form-control"
              style={{ paddingRight: '44px', fontFamily: showKey ? 'monospace' : 'inherit' }}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Incolla qui la tua API Key (${currentProviderObj.placeholder})`}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={showKey ? 'Nascondi chiave' : 'Mostra chiave'}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
