/**
 * Step 7: Wheel Selection
 * Wheel options with constraints: torque, suspension, snow-chain compatibility.
 */
export function WheelsStep({ config }) {
    const { state, selectWheels, isDisabled, getDisableReason } = config;
    const wheels = state.catalog?.wheels || [];

    const isWheelDisabled = (wheel) => {
        if (isDisabled('wheels', wheel.name)) return true;
        // Off-road wheels only for SUV
        if (wheel.name.includes('Off-Road') && state.model?.name !== 'SUV') return true;
        return false;
    };

    const handleSelect = async (wheel) => {
        if (isWheelDisabled(wheel)) return;
        await selectWheels({ name: wheel.name, size: wheel.size });
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Select Wheels</h2>
            <p className="step-subtitle">Complete the look with the perfect set of wheels</p>

            <div className="options-grid options-grid-3">
                {wheels.map(wheel => {
                    const disabled = isWheelDisabled(wheel);
                    const reason = getDisableReason('wheels', wheel.name) || 'Not available for your model';
                    const selected = state.wheels?.name === wheel.name;

                    return (
                        <div
                            key={wheel.id}
                            className={`card option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => handleSelect(wheel)}
                            title={disabled ? reason : wheel.description}
                        >
                            <div className="option-card-header">
                                <span className="option-card-icon">🛞</span>
                                {Number(wheel.price) > 0 && (
                                    <span className="option-card-price">+${Number(wheel.price).toLocaleString()}</span>
                                )}
                                {Number(wheel.price) === 0 && (
                                    <span className="option-card-price included">Included</span>
                                )}
                            </div>
                            <h3 className="option-card-name">{wheel.name}</h3>
                            <p className="option-card-detail">{wheel.description}</p>
                            {wheel.size >= 21 && (
                                <p className="option-card-note">⚠ Not compatible with snow chains</p>
                            )}
                            {disabled && <p className="option-card-warning">⚠ {reason}</p>}
                            {selected && <div className="selected-badge">Selected ✓</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default WheelsStep;
