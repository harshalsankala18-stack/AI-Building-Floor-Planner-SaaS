import React from 'react';

export const TermsAndConditions: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <div style={{ padding: 32, maxWidth: 840, margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif', color: '#0F172A', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 24, marginBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155' }}>Legal & Compliance</span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0 0', color: '#0F172A' }}>Terms and Conditions</h1>
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
          By accessing or using this architectural planning platform, you agree to be bound by these Terms and Conditions. This platform provides deterministic CAD generation, zoning verification, and spatial analysis tools for architectural concept design.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>1. NBC 2016 & Statutory Compliance</h3>
        <p>
          All generated floor plans, structural layouts, and zoning compliance reports are provided for conceptual schematic design purposes only. Every drawing generated carries the mandatory watermark: NOT FOR CONSTRUCTION. Final construction drawings, structural stability certificates, and statutory submissions must be reviewed, signed, and stamped by a licensed structural engineer or registered architect in accordance with NBC 2016 and local municipal bylaws (e.g., PMC, DCR).
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>2. RERA Carpet Area Standard</h3>
        <p>
          Carpet areas and room dimensions are calculated in accordance with the Real Estate Regulation and Development Act (RERA). Shafts, external walls, and service voids are excluded from carpet area computations. Users must verify measurements against site conditions prior to commercial agreements.
        </p>

        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', margin: '8px 0 4px 0' }}>3. Limitation of Liability</h3>
        <p>
          The platform creators and operators accept no legal liability for architectural discrepancies, construction errors, or municipal rejection resulting from unverified concept designs. Professional verification is mandatory before execution.
        </p>
      </div>
    </div>
  );
};
