import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuote } from '../services/api';
import CarScene from '../components/3d/CarScene';
import { COLOR_OPTIONS } from '../store/config3DStore';

// Map color names to hex values for 3D rendering
function getColorHex(colorName) {
    const match = COLOR_OPTIONS.find(c => c.name === colorName);
    return match ? match.hex : '#0a0a0a'; // default to black
}

export default function ConfigDetailPage() {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDetail() {
            try {
                const data = await getQuote(quoteId);
                setQuote(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [quoteId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 70px)', color: 'var(--color-text-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>⏳</div>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading configuration...</p>
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 70px)', color: 'var(--color-text-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Configuration not found</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>{error || 'Unable to load this configuration.'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/saved-configs')}>← Back to My Configurations</button>
                </div>
            </div>
        );
    }

    const items = quote.config_items || {};
    const colorHex = items.color_hex || getColorHex(items.exterior);
    const colorName = items.exterior || 'Default';

    // Build config details list
    const configDetails = [
        { label: 'Model', value: quote.model_name, icon: '🚗' },
        { label: 'Color', value: colorName, icon: '🎨' },
        items.engine && { label: 'Engine', value: items.engine, icon: '⚡' },
        items.transmission && { label: 'Transmission', value: items.transmission, icon: '⚙️' },
        items.trim && { label: 'Trim Level', value: items.trim, icon: '✨' },
        items.exterior_acc && { label: 'Exterior', value: items.exterior_acc, icon: '🔧' },
        items.interior && { label: 'Interior', value: items.interior, icon: '💺' },
        items.wheels && { label: 'Wheels', value: items.wheels, icon: '🛞' },
    ].filter(Boolean);

    const packages = items.packages || [];

    return (
        <main style={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

            {/* 3D Car Scene Background */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <CarScene
                    modelPath="/models/ferrari.glb"
                    selectedColor={colorHex}
                    carType={quote.model_name}
                />
            </div>

            {/* Back Button */}
            <button
                onClick={() => navigate('/saved-configs')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10,
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border-active)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                }}
            >
                ← Back
            </button>

            {/* Configuration Detail Panel */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '360px',
                maxHeight: 'calc(100% - 40px)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                zIndex: 10
            }}>
                {/* Quote Header */}
                <div style={{
                    background: 'rgba(17, 24, 39, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
                                {quote.model_name}
                            </h2>
                            <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                Quote #{quote.quote_number}
                            </p>
                        </div>
                        <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: 'var(--color-accent-subtle)',
                            color: 'var(--color-text-accent)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {quote.quote_status}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        padding: '0.75rem',
                        background: 'var(--color-bg-glass)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-border)',
                    }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Price</div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
                                ${Number(quote.quote_price).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                            {new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Configuration Items */}
                <div style={{
                    background: 'rgba(17, 24, 39, 0.9)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                        Configuration Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {configDetails.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.6rem 0.75rem',
                                background: 'var(--color-bg-glass)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                transition: 'border-color var(--transition-fast)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {item.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-primary)',
                                    textAlign: 'right',
                                    maxWidth: '180px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}

                        {/* Packages */}
                        {packages.length > 0 && (
                            <div style={{
                                padding: '0.6rem 0.75rem',
                                background: 'var(--color-bg-glass)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '1rem' }}>📦</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Packages
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '1.6rem' }}>
                                    {packages.map((pkg, i) => (
                                        <span key={i} style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: 'var(--font-size-xs)',
                                            background: 'var(--color-accent-subtle)',
                                            color: 'var(--color-text-accent)',
                                            fontWeight: 'var(--font-weight-medium)'
                                        }}>
                                            {pkg}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Base Price Info */}
                {quote.model_base_price && (
                    <div style={{
                        background: 'rgba(17, 24, 39, 0.9)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1rem 1.5rem',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Base Price ({quote.model_name})</span>
                        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                            ${Number(quote.model_base_price).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>
        </main>
    );
}
