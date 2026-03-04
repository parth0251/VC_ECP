import { useEffect } from 'react';

/**
 * Step 3: Transmission Selection
 * Auto-selects when forced (e.g., Electric → Automatic).
 */
export function TransmissionStep({ config }) {
    const { state, selectTransmission, isDisabled, getDisableReason } = config;
    const transmissions = state.catalog?.transmissions || [];

    // Handle auto-selection from rule engine
    useEffect(() => {
        const autoTrans = state.ruleResult?.autoSelections?.transmission;
        if (autoTrans && !state.transmission) {
            selectTransmission(autoTrans.value);
        }
    }, [state.ruleResult, state.transmission, selectTransmission]);

    const handleSelect = async (transmission) => {
        if (isDisabled('transmission', transmission.type)) return;
        await selectTransmission(transmission.type);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Select Transmission</h2>
            <p className="step-subtitle">Choose your driving experience</p>

            {/* Auto-selection notice */}
            {state.ruleResult?.autoSelections?.transmission && (
                <div className="auto-select-notice">
                    <span className="auto-select-icon">ℹ️</span>
                    <span>{state.ruleResult.autoSelections.transmission.reason}</span>
                </div>
            )}

            <div className="options-grid options-grid-2">
                {transmissions.map(trans => {
                    const disabled = isDisabled('transmission', trans.type);
                    const reason = getDisableReason('transmission', trans.type);
                    const selected = state.transmission === trans.type;

                    return (
                        <div
                            key={trans.id}
                            className={`card option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => handleSelect(trans)}
                            title={disabled ? reason : ''}
                        >
                            <div className="option-card-header">
                                <span className="option-card-icon">
                                    {trans.type === 'manual' ? '🕹️' : '🅰️'}
                                </span>
                                {Number(trans.price) > 0 && (
                                    <span className="option-card-price">+${Number(trans.price).toLocaleString()}</span>
                                )}
                                {Number(trans.price) === 0 && (
                                    <span className="option-card-price included">Included</span>
                                )}
                            </div>
                            <h3 className="option-card-name">{trans.name}</h3>
                            <p className="option-card-detail">{trans.type === 'manual' ? 'Full driver control' : 'Smooth shifting, adaptive response'}</p>
                            {disabled && <p className="option-card-warning">⚠ {reason}</p>}
                            {selected && <div className="selected-badge">Selected ✓</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TransmissionStep;
