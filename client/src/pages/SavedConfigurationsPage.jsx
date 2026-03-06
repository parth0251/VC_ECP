import React, { useEffect, useState } from 'react';
import { getQuotes } from '../services/api';

export default function SavedConfigurationsPage() {
    const [configs, setConfigs] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'classic', '3d'
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
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--color-text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>My Configurations</h1>

                {/* Filter toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.25rem', borderRadius: '8px' }}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: filter === 'all' ? 'var(--color-primary)' : 'transparent', color: filter === 'all' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontWeight: filter === 'all' ? 'bold' : 'normal' }}
                    >All</button>
                    <button
                        onClick={() => setFilter('classic')}
                        style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: filter === 'classic' ? 'var(--color-primary)' : 'transparent', color: filter === 'classic' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontWeight: filter === 'classic' ? 'bold' : 'normal' }}
                    >Classic Form</button>
                    <button
                        onClick={() => setFilter('3d')}
                        style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', background: filter === '3d' ? 'var(--color-primary)' : 'transparent', color: filter === '3d' ? 'white' : 'var(--color-text)', cursor: 'pointer', fontWeight: filter === '3d' ? 'bold' : 'normal' }}
                    >3D Viewer</button>
                </div>
            </div>

            {filteredConfigs.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px' }}>
                    <h3 style={{ margin: 0 }}>No configurations found</h3>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Create a car to see it here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
                    {filteredConfigs.map(c => (
                        <div
                            key={c.quote_id}
                            onClick={() => alert(`View/Load configuration ${c.quote_number} functionality coming soon!`)}
                            style={{
                                background: 'var(--color-surface)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.2)';
                                e.currentTarget.style.border = '1px solid var(--color-primary)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                e.currentTarget.style.border = 'none';
                            }}
                        >
                            <div style={{ height: '160px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                {/* Using model image as fallback if 3D snapshot doesn't exist */}
                                {c.model_image ? (
                                    <img src={c.model_image} alt={c.model_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '4rem' }}>🚗</span>
                                )}
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{c.model_name}</h3>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: c.config_type === '3d' ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        textTransform: 'uppercase'
                                    }}>
                                        {c.config_type || 'classic'}
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 1rem 0', opacity: 0.7, fontSize: '0.9rem' }}>Quote #{c.quote_number}</p>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Total Price</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${Number(c.quote_price).toLocaleString()}</div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
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
