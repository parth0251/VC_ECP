/**
 * Step 8: Packages Selection
 * Package cards with included features and complex dependencies.
 */
export function PackagesStep({ config }) {
    const { state, togglePackage, isDisabled, getDisableReason } = config;
    const packages = state.catalog?.packages || [];
    const selectedPackages = state.packages || [];

    const isPackageDisabled = (pkg) => {
        if (isDisabled('packages', pkg.name)) return true;
        // Tow package excluded with electric
        if (pkg.name === 'Tow Package' && state.engine === 'electric') return true;
        return false;
    };

    const handleToggle = async (pkg) => {
        if (isPackageDisabled(pkg)) return;
        await togglePackage(pkg.name);
    };

    return (
        <div className="step-container">
            <h2 className="step-title">Add Packages</h2>
            <p className="step-subtitle">Enhance your vehicle with curated feature bundles</p>

            {/* Auto-include notice */}
            {selectedPackages.includes('Winter Package') && (
                <div className="auto-select-notice">
                    <span className="auto-select-icon">❄️</span>
                    <span>Winter Package auto-includes Heated Front Seats and Heated Steering Wheel</span>
                </div>
            )}

            <div className="options-grid options-grid-2">
                {packages.map(pkg => {
                    const disabled = isPackageDisabled(pkg);
                    const reason = getDisableReason('packages', pkg.name) || 'Not available with current configuration';
                    const selected = selectedPackages.includes(pkg.name);
                    const includes = pkg.includes || [];

                    return (
                        <div
                            key={pkg.id}
                            className={`card option-card package-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => handleToggle(pkg)}
                            title={disabled ? reason : pkg.description}
                        >
                            <div className="option-card-header">
                                <span className="option-card-icon">
                                    {pkg.name.includes('Tech') ? '💻' : pkg.name.includes('Winter') ? '❄️' : pkg.name.includes('Safety') ? '🛡️' : '🔗'}
                                </span>
                                <span className="option-card-price">+${Number(pkg.price).toLocaleString()}</span>
                            </div>
                            <h3 className="option-card-name">{pkg.name}</h3>
                            <p className="option-card-detail">{pkg.description}</p>

                            {includes.length > 0 && (
                                <ul className="package-includes">
                                    {includes.map((item, i) => (
                                        <li key={i}>✓ {item}</li>
                                    ))}
                                </ul>
                            )}

                            {disabled && <p className="option-card-warning">⚠ {reason}</p>}

                            <div className="package-toggle">
                                <span className={`toggle-switch ${selected ? 'active' : ''}`}>
                                    {selected ? 'Added ✓' : 'Add Package'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PackagesStep;
