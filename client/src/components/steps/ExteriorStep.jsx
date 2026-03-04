/**
 * Step 5: Exterior Selection
 * Sub-sections: Paint Color, Body Kit, Roof Type.
 */
export function ExteriorStep({ config }) {
    const { state, selectExterior, isDisabled, getDisableReason } = config;
    const options = state.catalog?.exteriorOptions || [];

    const paints = options.filter(o => o.category === 'paint');
    const bodyKits = options.filter(o => o.category === 'body_kit');
    const roofTypes = options.filter(o => o.category === 'roof_type');

    const isMetallic = (name) => name.toLowerCase().includes('metallic') || name.toLowerCase().includes('matte');

    const handlePaint = async (name) => {
        if (state.trim?.toLowerCase() === 'base' && isMetallic(name)) return;
        await selectExterior('paint', name);
    };

    const handleBodyKit = async (name) => {
        if (isDisabled('bodyKit', name)) return;
        await selectExterior('bodyKit', name);
    };

    const handleRoof = async (name) => {
        if (isDisabled('roofType', name)) return;
        await selectExterior('roofType', name);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Exterior Options</h2>
            <p className="step-subtitle">Personalize the look of your {state.model?.name || 'vehicle'}</p>

            {/* Paint Colors */}
            <div className="option-section">
                <h3 className="option-section-title">Paint Color</h3>
                <div className="paint-grid">
                    {paints.map(paint => {
                        const disabled = state.trim?.toLowerCase() === 'base' && isMetallic(paint.name);
                        const selected = state.exterior.paint === paint.name;

                        return (
                            <div
                                key={paint.id}
                                className={`paint-swatch ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                onClick={() => handlePaint(paint.name)}
                                title={disabled ? 'Not available with Base trim' : `${paint.name} ${Number(paint.price) > 0 ? '+$' + Number(paint.price).toLocaleString() : '(Included)'}`}
                            >
                                <div
                                    className="paint-color"
                                    style={{ backgroundColor: paint.color_hex || '#888' }}
                                />
                                <span className="paint-name">{paint.name}</span>
                                <span className="paint-price">
                                    {Number(paint.price) > 0 ? `+$${Number(paint.price).toLocaleString()}` : 'Incl.'}
                                </span>
                                {disabled && <span className="paint-disabled-overlay">✕</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Body Kit */}
            <div className="option-section">
                <h3 className="option-section-title">Body Kit</h3>
                <div className="options-grid options-grid-3">
                    {bodyKits.map(kit => {
                        const disabled = isDisabled('bodyKit', kit.name);
                        const reason = getDisableReason('bodyKit', kit.name);
                        const selected = state.exterior.bodyKit === kit.name;

                        return (
                            <div
                                key={kit.id}
                                className={`card option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                onClick={() => handleBodyKit(kit.name)}
                                title={disabled ? reason : kit.description}
                            >
                                <h4 className="option-card-name">{kit.name}</h4>
                                <p className="option-card-detail">{kit.description}</p>
                                <span className="option-card-price">
                                    {Number(kit.price) > 0 ? `+$${Number(kit.price).toLocaleString()}` : 'Included'}
                                </span>
                                {disabled && <p className="option-card-warning">⚠ {reason}</p>}
                                {selected && <div className="selected-badge">Selected ✓</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Roof Type */}
            <div className="option-section">
                <h3 className="option-section-title">Roof Type</h3>
                <div className="options-grid options-grid-3">
                    {roofTypes.map(roof => {
                        const disabled = isDisabled('roofType', roof.name);
                        const reason = getDisableReason('roofType', roof.name);
                        const selected = state.exterior.roofType === roof.name;

                        return (
                            <div
                                key={roof.id}
                                className={`card option-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                                onClick={() => handleRoof(roof.name)}
                                title={disabled ? reason : roof.description}
                            >
                                <h4 className="option-card-name">{roof.name}</h4>
                                <p className="option-card-detail">{roof.description}</p>
                                <span className="option-card-price">
                                    {Number(roof.price) > 0 ? `+$${Number(roof.price).toLocaleString()}` : 'Included'}
                                </span>
                                {disabled && <p className="option-card-warning">⚠ {reason}</p>}
                                {selected && <div className="selected-badge">Selected ✓</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ExteriorStep;
