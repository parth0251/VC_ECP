import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes } from '../services/api';

// Map color names to car images
const COLOR_IMAGE_MAP = {
    'Midnight Black': '/images/cars/car_black.png',
    'Arctic White': '/images/cars/car_white.png',
    'Velocity Red': '/images/cars/car_red.png',
    'Ocean Blue': '/images/cars/car_blue.png',
    'Forest Green': '/images/cars/car_green.png',
    'Champagne Gold': '/images/cars/car_gold.png',
    'Matte Graphite': '/images/cars/car_graphite.png',
    'Pearl Titanium': '/images/cars/car_silver.png',
};

function getCarImage(colorName) {
    if (colorName && COLOR_IMAGE_MAP[colorName]) {
        return COLOR_IMAGE_MAP[colorName];
    }
    return '/images/cars/car_black.png'; // default fallback
}

export default function SavedConfigurationsPage() {
    const navigate = useNavigate();
    const [configs, setConfigs] = useState([]);
    const [filter] = useState('3d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQuotes() {
            try {
                const data = await getQuotes();
                setConfigs(data);
            } catch (error) {
                console.error('Failed to load saved configurations:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchQuotes();
    }, []);

    const filteredConfigs = configs.filter(c => {
        if (filter === 'all') return true;
        return c.config_type === filter;
    });

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>My Saved Configurations</h2>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>My Configurations</h1>
            </div>

            {filteredConfigs.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px' }}>
                    <h3 style={{ margin: 0 }}>No configurations found</h3>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Create a car to see it here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.5rem', width: '100%' }}>
                    {filteredConfigs.map(c => (
                        <div
                            key={c.quote_id}
                            onClick={() => navigate(`/config/${c.quote_id}`)}
                            style={{
                                background: 'var(--color-bg-card)',
                                borderRadius: 'var(--radius-xl)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-md)',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                                e.currentTarget.style.borderColor = 'var(--color-border-active)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                            }}
                        >
                            {/* Car Image */}
                            <div style={{
                                height: '170px',
                                background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-primary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderBottom: '1px solid var(--color-border)',
                                padding: '0.5rem'
                            }}>
                                <img
                                    src={getCarImage(c.color_name)}
                                    alt={`${c.model_name} - ${c.color_name || 'Default'}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{c.model_name}</h3>
                                    <span style={{
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        background: 'var(--color-accent-subtle)',
                                        color: 'var(--color-text-accent)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        3D
                                    </span>
                                </div>

                                {/* Color label */}
                                {c.color_name && (
                                    <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                        {c.color_name}
                                    </p>
                                )}

                                <p style={{ margin: '0.5rem 0 1rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Quote #{c.quote_number}</p>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Total Price</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>${Number(c.quote_price).toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
