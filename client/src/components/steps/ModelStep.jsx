import { useEffect, useState } from 'react';
import { getModels } from '../../services/api';

/**
 * Step 1: Model Selection
 * Card-based UI to select vehicle model (Sedan, SUV, Coupe).
 */
export function ModelStep({ config, onNext }) {
    const { state, selectModel } = config;
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchModels() {
            try {
                const data = await getModels();
                setModels(data);
            } catch (err) {
                console.error('Failed to fetch models:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchModels();
    }, []);

    const handleSelect = async (model) => {
        await selectModel(model);
    };

    if (loading) {
        return (
            <div className="step-container">
                <h2 className="step-title">Select Your Model</h2>
                <div className="step-loading">
                    <div className="shimmer-card"></div>
                    <div className="shimmer-card"></div>
                    <div className="shimmer-card"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="step-container">
            <h2 className="step-title">Select Your Model</h2>
            <p className="step-subtitle">Choose the vehicle that fits your lifestyle</p>

            <div className="model-grid">
                {models.map(model => (
                    <div
                        key={model.id}
                        className={`card model-card ${state.model?.id === model.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(model)}
                    >
                        <div className="model-card-image">
                            <span className="model-card-emoji">
                                {model.name === 'Sedan' ? '🚗' : model.name === 'SUV' ? '🚙' : '🏎️'}
                            </span>
                        </div>
                        <h3 className="model-card-name">{model.name}</h3>
                        <p className="model-card-desc">{model.description}</p>
                        <div className="model-card-price">
                            From <strong>${Number(model.base_price).toLocaleString()}</strong>
                        </div>
                        {state.model?.id === model.id && (
                            <div className="selected-badge">Selected ✓</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ModelStep;
