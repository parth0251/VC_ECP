import React, { useEffect, useState } from 'react';
import useConfig3DStore from '../../store/config3DStore';
import { getModels } from '../../services/api';

export default function ModelSelector() {
    const { selectedCarId, setCarData } = useConfig3DStore();
    const [cars, setCars] = useState([]);

    useEffect(() => {
        async function load() {
            try {
                const data = await getModels();
                setCars(data);
                if (data.length > 0 && !selectedCarId) {
                    // Select first car by default
                    setCarData(data[0]);
                }
            } catch (err) {
                console.error('Failed to load cars', err);
            }
        }
        load();
    }, [selectedCarId, setCarData]);

    if (cars.length === 0) return null;

    return (
        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Vehicle Model</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {cars.map(car => {
                    const isSelected = selectedCarId === (car._id || car.id);
                    return (
                        <button
                            key={car._id || car.id}
                            onClick={() => setCarData(car)}
                            style={{
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                                color: isSelected ? 'white' : 'var(--color-text)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ fontSize: '1rem' }}>{car.brand} {car.name}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Starting at ${Number(car.base_price).toLocaleString()}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
