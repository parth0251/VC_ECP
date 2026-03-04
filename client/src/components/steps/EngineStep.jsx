/**
 * Step 2: Engine Selection
 * Cards with constraint enforcement — disabled engines are greyed out with tooltip.
 */
export function EngineStep({ config }) {
    const { state, selectEngine, isDisabled, getDisableReason } = config;
    const engines = state.catalog?.engines || [];

    const handleSelect = async (engine) => {
        if (isDisabled('engine', engine.type)) return;
        await selectEngine(engine.type);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Select Engine</h2>
            <p className="step-subtitle">Choose the powertrain for your {state.model?.name || 'vehicle'}</p>

            <div className="options-grid">
                {engines.map(engine => {
                    const disabled = isDisabled('engine', engine.type);
                    const reason = getDisableReason('engine', engine.type);
                    const selected = state.engine === engine.type;

                    return (
                        <div
                            key={engine.id}
                            className={`card option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => handleSelect(engine)}
                            title={disabled ? reason : engine.description}
                        >
                            <div className="option-card-header">
                                <span className="option-card-icon">
                                    {engine.type === 'electric' ? '⚡' : engine.type === 'hybrid' ? '🔋' : engine.type === 'v8' ? '🔥' : engine.type === 'diesel' ? '⛽' : '🔧'}
                                </span>
                                {Number(engine.price) > 0 && (
                                    <span className="option-card-price">+${Number(engine.price).toLocaleString()}</span>
                                )}
                                {Number(engine.price) === 0 && (
                                    <span className="option-card-price included">Included</span>
                                )}
                            </div>
                            <h3 className="option-card-name">{engine.name}</h3>
                            <p className="option-card-detail">{engine.horsepower} HP · {engine.type.toUpperCase()}</p>
                            {disabled && <p className="option-card-warning">⚠ {reason}</p>}
                            {selected && <div className="selected-badge">Selected ✓</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default EngineStep;
