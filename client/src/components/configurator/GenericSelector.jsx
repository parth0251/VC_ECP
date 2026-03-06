import React from 'react';
import useConfig3DStore from '../../store/config3DStore';

export default function GenericSelector({ title, catalogKey, selectedItem, onSelect, renderItem }) {
    const { catalog, ruleResult } = useConfig3DStore();
    const items = catalog?.[catalogKey] || [];

    if (items.length === 0) return null;

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>{title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map(item => {
                    const isSelected = Array.isArray(selectedItem)
                        ? selectedItem.some(p => p.id === item.id)
                        : selectedItem?.id === item.id;

                    // Validation Check
                    let isDisabled = false;
                    let disableReason = null;
                    if (ruleResult?.disabledOptions) {
                        for (const optionsArray of Object.values(ruleResult.disabledOptions)) {
                            const found = optionsArray.find(d =>
                                d.id === item.name || d.id === item.type || d.id === item.id
                            );
                            if (found) {
                                isDisabled = true;
                                disableReason = found.reason;
                                break;
                            }
                        }
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => { if (!isDisabled) onSelect(item); }}
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
                                    {item.name}
                                </span>
                                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                    {Number(item.price) > 0 ? `+$${Number(item.price).toLocaleString()}` : 'Included'}
                                </span>
                            </div>
                            {item.description && (
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>
                                    {item.description}
                                </div>
                            )}
                            {isDisabled && disableReason && (
                                <div style={{ fontSize: '0.75rem', color: '#ff6b6b', marginTop: '4px', fontWeight: 'bold' }}>
                                    {disableReason}
                                </div>
                            )}
                            {renderItem && renderItem(item)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
