import React from 'react';
import useConfig3DStore, { COLOR_OPTIONS } from '../../store/config3DStore';

export default function ColorPicker() {
    const { selectedColor, setColor } = useConfig3DStore();

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Exterior Color</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {COLOR_OPTIONS.map((color) => {
                    const isSelected = selectedColor.hex === color.hex;
                    return (
                        <button
                            key={color.name}
                            onClick={() => setColor(color)}
                            title={`${color.name} (+$${color.premium})`}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: color.hex,
                                border: isSelected ? '3px solid var(--color-primary)' : '2px solid transparent',
                                cursor: 'pointer',
                                boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                                transition: 'all 0.2s ease',
                            }}
                        />
                    );
                })}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{selectedColor.name}</span>
                {selectedColor.premium > 0 ? (
                    <span style={{ color: 'var(--color-primary)' }}>+${selectedColor.premium}</span>
                ) : (
                    <span>Included</span>
                )}
            </div>
        </div>
    );
}
