import React from 'react';
import useConfig3DStore from '../../store/config3DStore';

export default function EngineSelector() {
    const { catalog, selectedEngine, setEngine, ruleResult } = useConfig3DStore();
    const engines = catalog?.engines || [];

    if (engines.length === 0) return null;

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Powertrain Choice</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {engines.map(engine => {
                    const isSelected = selectedEngine?.id === engine.id;

                    let isDisabled = false;
                    let disableReason = null;
                    if (ruleResult?.disabledOptions?.engine) {
                        const found = ruleResult.disabledOptions.engine.find(d => d.id === engine.type || d.id === engine.name);
                        if (found) {
                            isDisabled = true;
                            disableReason = found.reason;
                        }
                    }

                    return (
                        <button
                            key={engine.id}
                            onClick={() => { if (!isDisabled) setEngine(engine); }}
                            disabled={isDisabled}
                            style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                                color: isSelected ? 'white' : 'var(--color-text)',
                                border: isDisabled ? '1px dashed rgba(255,0,0,0.4)' : 'none',
                                opacity: isDisabled ? 0.4 : 1,
                                borderRadius: '8px',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '1rem' }}>
                                    {engine.type === 'electric' ? '⚡ ' : engine.type === 'v8' ? '🔥 ' : '⚙️ '}
                                    {engine.name}
                                </span>
                                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                    {Number(engine.price) > 0 ? `+$${Number(engine.price).toLocaleString()}` : 'Included'}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                                {engine.horsepower} HP · {engine.type.toUpperCase()}
                            </div>
                            {isDisabled && disableReason && (
                                <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '4px', fontWeight: 'bold' }}>
                                    {disableReason}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
