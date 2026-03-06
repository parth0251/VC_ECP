import React from 'react';
import useConfig3DStore from '../../store/config3DStore';

const MARKETS = [
    { id: 'US-CA', name: 'USA - California' },
    { id: 'US-NY', name: 'USA - New York' },
    { id: 'US-TX', name: 'USA - Texas' },
    { id: 'US-GEN', name: 'USA - General' },
    { id: 'CA-ON', name: 'Canada - Ontario' },
    { id: 'CA-BC', name: 'Canada - British Columbia' },
    { id: 'EU-DE', name: 'Europe - Germany' },
    { id: 'EU-FR', name: 'Europe - France' },
    { id: 'EU-IT', name: 'Europe - Italy' },
    { id: 'EU-ES', name: 'Europe - Spain' },
    { id: 'UK-EN', name: 'United Kingdom - England' },
    { id: 'JP-TK', name: 'Japan - Tokyo' },
    { id: 'AU-NSW', name: 'Australia - New South Wales' },
    { id: 'BR-SP', name: 'Brazil - São Paulo' },
    { id: 'AE-DU', name: 'UAE - Dubai' },
];

export default function RegionSelector() {
    const { market, setMarket } = useConfig3DStore();

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>Select Region</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', opacity: 0.8, marginBottom: '1rem' }}>
                Vehicle pricing, constraints, and tax incentives change based on regional availability and regulations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-surface-hover)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        width: '100%'
                    }}
                >
                    {MARKETS.map(m => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
