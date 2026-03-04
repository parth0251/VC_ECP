/**
 * Step 6: Interior Selection
 * Sub-sections: Seat Material, Seat Color, Dashboard Finish, Ambient Lighting.
 */
export function InteriorStep({ config }) {
    const { state, selectInterior, isDisabled, getDisableReason } = config;
    const options = state.catalog?.interiorOptions || [];

    const seatMaterials = options.filter(o => o.category === 'seat_material');
    const seatColors = options.filter(o => o.category === 'seat_color');
    const dashboards = options.filter(o => o.category === 'dashboard');
    const lighting = options.filter(o => o.category === 'ambient_lighting');

    const isSeatColorDisabled = (name) => {
        if (isDisabled('seatColor', name)) return true;
        if (state.trim?.toLowerCase() === 'base' && name === 'Red') return true;
        return false;
    };

    const renderOptionGroup = (title, items, stateKey, handleSelect, checkDisabled) => (
        <div className="option-section">
            <h3 className="option-section-title">{title}</h3>
            <div className="options-grid options-grid-4">
                {items.map(item => {
                    const disabled = checkDisabled ? checkDisabled(item.name) : false;
                    const reason = getDisableReason('seatColor', item.name);
                    const selected = state.interior[stateKey] === item.name;

                    return (
                        <div
                            key={item.id}
                            className={`card option-card option-card-sm ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => !disabled && handleSelect(stateKey, item.name)}
                            title={disabled ? (reason || 'Not available with current configuration') : item.description}
                        >
                            {item.color_hex && (
                                <div className="option-color-dot" style={{ backgroundColor: item.color_hex }} />
                            )}
                            <h4 className="option-card-name">{item.name}</h4>
                            <span className="option-card-price">
                                {Number(item.price) > 0 ? `+$${Number(item.price).toLocaleString()}` : 'Incl.'}
                            </span>
                            {disabled && <p className="option-card-warning">⚠ Not available</p>}
                            {selected && <div className="selected-badge">✓</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="step-container">
            <h2 className="step-title">Interior Options</h2>
            <p className="step-subtitle">Craft your perfect cabin experience</p>

            {renderOptionGroup('Seat Material', seatMaterials, 'seatMaterial', selectInterior)}
            {renderOptionGroup('Seat Color', seatColors, 'seatColor', selectInterior, isSeatColorDisabled)}
            {renderOptionGroup('Dashboard Finish', dashboards, 'dashboard', selectInterior)}
            {renderOptionGroup('Ambient Lighting', lighting, 'ambientLighting', selectInterior)}
        </div>
    );
}

export default InteriorStep;
