import React, { useState, useRef, useEffect } from 'react';
import useConfig3DStore from '../../store/config3DStore';

const MARKETS = [
    { id: 'US-CA', name: 'USA - California' },
    { id: 'US-NY', name: 'USA - New York' },
    { id: 'US-TX', name: 'USA - Texas' },
    { id: 'US-FL', name: 'USA - Florida' },
    { id: 'US-IL', name: 'USA - Illinois' },
    { id: 'US-WA', name: 'USA - Washington' },
    { id: 'US-PA', name: 'USA - Pennsylvania' },
    { id: 'US-OH', name: 'USA - Ohio' },
    { id: 'US-GA', name: 'USA - Georgia' },
    { id: 'US-MI', name: 'USA - Michigan' },
];

const styles = {
    wrapper: {
        position: 'relative',
        width: '100%',
    },
    trigger: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontFamily: 'var(--font-family)',
        fontWeight: 'var(--font-weight-medium)',
        transition: 'all var(--transition-fast)',
        outline: 'none',
        letterSpacing: '0.01em',
    },
    triggerHover: {
        borderColor: 'var(--color-border-active)',
        boxShadow: '0 0 0 3px var(--color-accent-glow)',
    },
    chevron: (isOpen) => ({
        transition: 'transform var(--transition-fast)',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        color: 'var(--color-text-muted)',
        fontSize: '0.7rem',
    }),
    dropdown: {
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
        maxHeight: '280px',
        overflowY: 'auto',
        padding: '4px',
        animation: 'fadeIn 150ms ease',
    },
    option: (isSelected, isHovered) => ({
        display: 'block',
        width: '100%',
        padding: '0.6rem 0.85rem',
        background: isSelected
            ? 'var(--color-accent-subtle)'
            : isHovered
                ? 'var(--color-bg-hover)'
                : 'transparent',
        color: isSelected
            ? 'var(--color-text-accent)'
            : 'var(--color-text-primary)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontFamily: 'var(--font-family)',
        fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        textAlign: 'left',
        transition: 'background var(--transition-fast), color var(--transition-fast)',
        letterSpacing: '0.01em',
        borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
    }),
};

export default function RegionSelector() {
    const { market, setMarket } = useConfig3DStore();
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState(null);
    const wrapperRef = useRef(null);

    const selectedMarket = MARKETS.find(m => m.id === market) || MARKETS[0];

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        if (isOpen) {
            document.addEventListener('keydown', handleKey);
            return () => document.removeEventListener('keydown', handleKey);
        }
    }, [isOpen]);

    const handleSelect = (id) => {
        setMarket(id);
        setIsOpen(false);
    };

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>Select Region</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Vehicle pricing, constraints, and tax incentives change based on regional availability and regulations.
            </p>

            <div ref={wrapperRef} style={styles.wrapper}>
                {/* Trigger Button */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    style={styles.trigger}
                    onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, { borderColor: 'var(--color-border-active)', boxShadow: '0 0 0 3px var(--color-accent-glow)' });
                    }}
                    onMouseLeave={(e) => {
                        if (!isOpen) {
                            Object.assign(e.currentTarget.style, { borderColor: 'var(--color-border)', boxShadow: 'none' });
                        }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span>{selectedMarket.name}</span>
                    <span style={styles.chevron(isOpen)}>▼</span>
                </button>

                {/* Dropdown List */}
                {isOpen && (
                    <div style={styles.dropdown} role="listbox">
                        {MARKETS.map(m => (
                            <button
                                key={m.id}
                                role="option"
                                aria-selected={m.id === market}
                                style={styles.option(m.id === market, hoveredId === m.id)}
                                onClick={() => handleSelect(m.id)}
                                onMouseEnter={() => setHoveredId(m.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
