import React from 'react';
import useConfig3DStore from '../../store/config3DStore';

export default function DriveOrientationSelector() {
    const { selectedDriveOrientation, setDriveOrientation } = useConfig3DStore();

    const options = [
        {
            value: 'LHD',
            label: 'Left Hand Drive (LHD)',
            description: 'Steering wheel on the left side',
            icon: (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="12" r="5" />
                    <path d="M9 7v10" />
                    <path d="M4 12h10" />
                    <path d="M16 8h4v8h-4" />
                </svg>
            )
        },
        {
            value: 'RHD',
            label: 'Right Hand Drive (RHD)',
            description: 'Steering wheel on the right side',
            icon: (
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="15" cy="12" r="5" />
                    <path d="M15 7v10" />
                    <path d="M10 12h10" />
                    <path d="M4 8h4v8H4" />
                </svg>
            )
        }
    ];

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Drive Orientation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {options.map((option) => {
                    const isSelected = selectedDriveOrientation === option.value;
                    return (
                        <div
                            key={option.value}
                            onClick={() => setDriveOrientation(option.value)}
                            style={{
                                padding: '1rem',
                                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px',
                                background: isSelected ? 'var(--color-surface-hover)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                        >
                            <div style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                                {option.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{option.label}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{option.description}</div>
                            </div>
                            {isSelected && (
                                <div style={{ color: 'var(--color-primary)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
