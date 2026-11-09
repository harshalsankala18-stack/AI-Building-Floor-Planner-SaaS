import React from 'react';

export const PrivacyPolicy: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <div style={{ padding: 32, maxWidth: 840, margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif', color: '#0F172A', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 24, marginBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155' }}>Compliance & Legal</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0 0', color: '#0F172A' }}>Privacy Policy</h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}
          >
            Close
          </button>
        )}
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p>
          This Privacy Policy governs the collection, storage, and processing of project data, architectural plans, and user details on our deterministic architectural planning and CAD generation platform, in compliance with the Digital Personal Data Protection (DPDP) Act 2023 of India.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>1. Local-First & Cloud Storage</h3>
        <p>
          All project geometry, building models, and design states are processed locally within your browser session and stored securely in client-side storage or authorized project backends. We do not sell or monetize architectural layouts, floor dimensions, or proprietary property configurations.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>2. Data Protection & DPDP Compliance</h3>
        <p>
          In accordance with Indian privacy standards, you retain complete ownership of your architectural data. Personal identifiers are restricted to necessary authentication and project collaboration tokens. You may request permanent deletion of your project workspace and cached data at any time.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>3. Secure AI & Deterministic Processing</h3>
        <p>
          When utilizing AI planning or vision interpretation services, prompt data and architectural vectors are transmitted securely over encrypted channels. Data is not used to train public third-party models without explicit enterprise consent.
        </p>
      </div>
    </div>
  );
};
