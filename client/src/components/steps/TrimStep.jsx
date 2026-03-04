/**
 * Step 4: Trim Selection
 * Shows trims with feature summaries. Cascading rules apply on selection.
 */
export function TrimStep({ config }) {
    const { state, selectTrim } = config;
    const trims = state.catalog?.trims || [];

    const trimFeatures = {
        'Base': ['Standard suspension', 'Cloth upholstery', 'Basic infotainment', '17" wheels'],
        'Sport': ['Sport suspension', 'Aggressive styling', 'Performance tuning', '19" sport wheels', 'Sport seats'],
        'Luxury': ['Adaptive suspension', 'Premium leather', 'Advanced tech suite', '20" premium wheels', 'Ambient lighting'],
    };

    const handleSelect = async (trim) => {
        await selectTrim(trim.name);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Select Trim</h2>
            <p className="step-subtitle">Define the character of your {state.model?.name || 'vehicle'}</p>

            {/* Cascading rules notice */}
            {state.ruleResult?.notifications?.length > 0 && state.trim && (
                <div className="auto-select-notice">
                    <span className="auto-select-icon">⚠️</span>
                    <span>Changing trim may auto-adjust incompatible selections.</span>
                </div>
            )}

            <div className="options-grid options-grid-3">
                {trims.map(trim => {
                    const selected = state.trim === trim.name;
                    const features = trimFeatures[trim.name] || [];

                    return (
                        <div
                            key={trim.id}
                            className={`card option-card trim-card ${selected ? 'selected' : ''}`}
                            onClick={() => handleSelect(trim)}
                        >
                            <div className="option-card-header">
                                <span className="option-card-icon">
                                    {trim.name === 'Sport' ? '🏁' : trim.name === 'Luxury' ? '👑' : '📋'}
                                </span>
                                {Number(trim.price) > 0 && (
                                    <span className="option-card-price">+${Number(trim.price).toLocaleString()}</span>
                                )}
                                {Number(trim.price) === 0 && (
                                    <span className="option-card-price included">Included</span>
                                )}
                            </div>
                            <h3 className="option-card-name">{trim.name}</h3>
                            <p className="option-card-detail">{trim.description}</p>
                            <ul className="trim-features">
                                {features.map((f, i) => (
                                    <li key={i}>✓ {f}</li>
                                ))}
                            </ul>
                            {selected && <div className="selected-badge">Selected ✓</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TrimStep;
