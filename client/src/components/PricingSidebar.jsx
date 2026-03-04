/**
 * PricingSidebar — Live pricing breakdown.
 * Shows running total, line items, and incentives.
 */
export function PricingSidebar({ pricing, visible = true }) {
    if (!visible || !pricing) {
        return (
            <aside className="pricing-sidebar">
                <div className="pricing-header">
                    <h3>Price Summary</h3>
                </div>
                <div className="pricing-empty">
                    <p className="text-muted">Select a model to see pricing</p>
                </div>
            </aside>
        );
    }

    const formatPrice = (val) => {
        const num = Number(val) || 0;
        return num < 0
            ? `-$${Math.abs(num).toLocaleString()}`
            : `$${num.toLocaleString()}`;
    };

    return (
        <aside className="pricing-sidebar">
            <div className="pricing-header">
                <h3>Price Summary</h3>
                <div className="pricing-total">
                    <span className="pricing-total-label">Total</span>
                    <span className="pricing-total-amount">{formatPrice(pricing.grandTotal)}</span>
                </div>
            </div>

            <div className="pricing-body">
                {/* Line Items */}
                <div className="pricing-section">
                    {pricing.lineItems?.map((item, i) => (
                        <div key={i} className="pricing-line-item">
                            <div className="pricing-line-info">
                                <span className="pricing-line-category">{item.category}</span>
                                <span className="pricing-line-name">{item.name}</span>
                            </div>
                            <span className={`pricing-line-price ${item.price === 0 ? 'text-muted' : ''}`}>
                                {item.price === 0 ? 'Incl.' : formatPrice(item.price)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Incentives */}
                {pricing.incentives?.length > 0 && (
                    <div className="pricing-section pricing-incentives">
                        <div className="pricing-section-title">Incentives</div>
                        {pricing.incentives.map((inc, i) => (
                            <div key={i} className="pricing-line-item">
                                <span className="pricing-line-name text-success">{inc.name}</span>
                                <span className="pricing-line-price text-success">{formatPrice(inc.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Breakdown */}
                <div className="pricing-breakdown">
                    <div className="pricing-breakdown-row">
                        <span>Base Price</span>
                        <span>{formatPrice(pricing.basePrice)}</span>
                    </div>
                    <div className="pricing-breakdown-row">
                        <span>Options Total</span>
                        <span>{formatPrice(pricing.optionsTotal)}</span>
                    </div>
                    {pricing.incentivesTotal < 0 && (
                        <div className="pricing-breakdown-row text-success">
                            <span>Incentives</span>
                            <span>{formatPrice(pricing.incentivesTotal)}</span>
                        </div>
                    )}
                    <div className="pricing-breakdown-row pricing-grand-total">
                        <span>Grand Total</span>
                        <span>{formatPrice(pricing.grandTotal)}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default PricingSidebar;
