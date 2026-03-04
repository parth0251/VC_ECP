import { useState } from 'react';

/**
 * Step 9: Review & Save
 * Full configuration summary with pricing breakdown.
 * Two paths: Get Quote or Place Order.
 */
export function ReviewStep({ config }) {
    const { state, actions } = config;
    const [showQuoteForm, setShowQuoteForm] = useState(false);
    const [showOrderConfirm, setShowOrderConfirm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [orderResult, setOrderResult] = useState(null);

    const pricing = state.pricingResult;

    const configSummary = [
        { label: 'Model', value: state.model?.name, price: state.model?.base_price },
        { label: 'Engine', value: state.catalog?.engines?.find(e => e.type === state.engine)?.name },
        { label: 'Transmission', value: state.catalog?.transmissions?.find(t => t.type === state.transmission)?.name },
        { label: 'Trim', value: state.trim },
        { label: 'Paint', value: state.exterior?.paint },
        { label: 'Body Kit', value: state.exterior?.bodyKit },
        { label: 'Roof Type', value: state.exterior?.roofType },
        { label: 'Seat Material', value: state.interior?.seatMaterial },
        { label: 'Seat Color', value: state.interior?.seatColor },
        { label: 'Dashboard', value: state.interior?.dashboard },
        { label: 'Ambient Lighting', value: state.interior?.ambientLighting },
        { label: 'Wheels', value: state.wheels?.name },
        { label: 'Packages', value: state.packages?.length > 0 ? state.packages.join(', ') : 'None' },
    ];

    const handleQuote = () => setShowQuoteForm(true);

    const handleOrder = () => setShowOrderConfirm(true);

    const submitQuote = async (e) => {
        e.preventDefault();
        const quoteNumber = 'Q-' + Date.now().toString(36).toUpperCase();
        setOrderResult({
            type: 'quote',
            number: quoteNumber,
            name: formData.name,
            email: formData.email,
        });
        setShowQuoteForm(false);
    };

    const submitOrder = async () => {
        const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();
        setOrderResult({
            type: 'order',
            number: orderNumber,
        });
        setShowOrderConfirm(false);
    };

    const startNew = () => {
        actions.reset();
        actions.setStep(0);
        setOrderResult(null);
    };

    // ---- Order/Quote Confirmation ----
    if (orderResult) {
        return (
            <div className="step-container review-confirmation">
                <div className="confirmation-icon">
                    {orderResult.type === 'order' ? '🎉' : '📄'}
                </div>
                <h2 className="step-title">
                    {orderResult.type === 'order' ? 'Order Confirmed!' : 'Quote Generated!'}
                </h2>
                <p className="step-subtitle">
                    {orderResult.type === 'order'
                        ? 'Your vehicle order has been placed successfully.'
                        : 'Your quote has been saved. Check your email for details.'}
                </p>

                <div className="confirmation-details card">
                    <div className="confirmation-row">
                        <span>{orderResult.type === 'order' ? 'Order Number' : 'Quote Number'}</span>
                        <strong>{orderResult.number}</strong>
                    </div>
                    {orderResult.name && (
                        <div className="confirmation-row">
                            <span>Customer</span>
                            <strong>{orderResult.name}</strong>
                        </div>
                    )}
                    <div className="confirmation-row">
                        <span>Vehicle</span>
                        <strong>{state.model?.name} — {state.trim}</strong>
                    </div>
                    <div className="confirmation-row">
                        <span>Total Price</span>
                        <strong className="text-accent">${pricing?.grandTotal?.toLocaleString()}</strong>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={startNew} style={{ marginTop: '2rem' }}>
                    🚗 Start New Configuration
                </button>
            </div>
        );
    }

    // ---- Quote Form Modal ----
    if (showQuoteForm) {
        return (
            <div className="step-container">
                <div className="modal-overlay" onClick={() => setShowQuoteForm(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <h3>Get Your Quote</h3>
                        <p className="text-muted">Enter your details to receive a personalized quote</p>
                        <form onSubmit={submitQuote} className="quote-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowQuoteForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Generate Quote</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Order Confirmation Dialog ----
    if (showOrderConfirm) {
        return (
            <div className="step-container">
                <div className="modal-overlay" onClick={() => setShowOrderConfirm(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <h3>Confirm Your Order</h3>
                        <p className="text-muted">Please review your configuration before placing the order.</p>
                        <div className="confirmation-details">
                            <div className="confirmation-row">
                                <span>Vehicle</span>
                                <strong>{state.model?.name} — {state.trim}</strong>
                            </div>
                            <div className="confirmation-row">
                                <span>Grand Total</span>
                                <strong className="text-accent">${pricing?.grandTotal?.toLocaleString()}</strong>
                            </div>
                        </div>
                        <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowOrderConfirm(false)}>Cancel</button>
                            <button className="btn btn-success" onClick={submitOrder}>✓ Place Order</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Main Review Page ----
    return (
        <div className="step-container">
            <h2 className="step-title">Review Your Configuration</h2>
            <p className="step-subtitle">Everything looks great — here's your complete build</p>

            {/* Config Summary */}
            <div className="review-summary card">
                <h3 className="review-section-title">Configuration Details</h3>
                {configSummary.map((item, i) => (
                    item.value && (
                        <div key={i} className="review-row">
                            <span className="review-label">{item.label}</span>
                            <span className="review-value">{item.value}</span>
                        </div>
                    )
                ))}
            </div>

            {/* Pricing Breakdown */}
            {pricing && (
                <div className="review-pricing card">
                    <h3 className="review-section-title">Pricing Breakdown</h3>
                    {pricing.lineItems?.map((item, i) => (
                        <div key={i} className="review-row">
                            <span className="review-label">
                                <span className="text-muted">{item.category}:</span> {item.name}
                            </span>
                            <span className="review-value">
                                {item.price === 0 ? 'Included' : `$${Number(item.price).toLocaleString()}`}
                            </span>
                        </div>
                    ))}

                    {pricing.incentives?.map((inc, i) => (
                        <div key={`inc-${i}`} className="review-row text-success">
                            <span className="review-label">{inc.name}</span>
                            <span className="review-value">-${Math.abs(inc.amount).toLocaleString()}</span>
                        </div>
                    ))}

                    <div className="review-row review-total">
                        <span className="review-label">Grand Total</span>
                        <span className="review-value">${pricing.grandTotal?.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="review-actions">
                <button className="btn btn-secondary" onClick={() => actions.setStep(0)}>
                    ← Modify Configuration
                </button>
                <button className="btn btn-primary" onClick={handleQuote}>
                    📄 Get Quote
                </button>
                <button className="btn btn-success" onClick={handleOrder}>
                    ✓ Place Order
                </button>
            </div>
        </div>
    );
}

export default ReviewStep;
