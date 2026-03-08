/**
 * Pricing Engine — Pure function module.
 * Computes pricing breakdown for a given configuration.
 *
 * All pricing logic is isolated here — no DB or HTTP dependencies.
 */

/**
 * Calculate full pricing breakdown.
 *
 * @param {Object} config - Current configuration state
 * @param {Object} catalog - Full catalog data with prices
 *
 * @returns {{ basePrice: number, enginePrice: number, transmissionPrice: number,
 *             trimPrice: number, exteriorTotal: number, interiorTotal: number,
 *             wheelsPrice: number, packagesTotal: number, optionsTotal: number,
 *             incentives: Array<{name: string, amount: number}>,
 *             incentivesTotal: number, grandTotal: number, lineItems: Array }}
 */
function calculatePricing(config, catalog) {
    const lineItems = [];
    let optionsTotal = 0;

    // --- Base Price ---
    let model;
    if (catalog.model && catalog.model.name && catalog.model.name.toLowerCase() === (config.model || '').toLowerCase()) {
        model = catalog.model;
    } else if (catalog.models) {
        model = catalog.models.find(m => m.name.toLowerCase() === (config.model || '').toLowerCase());
    }
    const basePrice = model ? parseFloat(model.base_price) : 0;
    lineItems.push({ category: 'Base Price', name: model?.name || 'No Model', price: basePrice });

    // --- Engine ---
    const engine = catalog.engines?.find(e =>
        e.type === config.engine || e.name === config.engine
    );
    const enginePrice = engine ? parseFloat(engine.price) : 0;
    if (engine) {
        lineItems.push({ category: 'Engine', name: engine.name, price: enginePrice });
        optionsTotal += enginePrice;
    }

    // --- Transmission ---
    const transmission = catalog.transmissions?.find(t =>
        t.type === config.transmission || t.name === config.transmission
    );
    const transmissionPrice = transmission ? parseFloat(transmission.price) : 0;
    if (transmission) {
        lineItems.push({ category: 'Transmission', name: transmission.name, price: transmissionPrice });
        optionsTotal += transmissionPrice;
    }

    // --- Trim ---
    const trim = catalog.trims?.find(t =>
        t.name.toLowerCase() === (config.trim || '').toLowerCase()
    );
    const trimPrice = trim ? parseFloat(trim.price) : 0;
    if (trim) {
        lineItems.push({ category: 'Trim', name: trim.name, price: trimPrice });
        optionsTotal += trimPrice;
    }

    // --- Exterior Options ---
    let exteriorTotal = 0;
    if (config.exterior) {
        ['paint', 'bodyKit', 'roofType'].forEach(key => {
            if (config.exterior[key]) {
                const opt = catalog.exteriorOptions?.find(o => o.name === config.exterior[key]);
                if (opt) {
                    const price = parseFloat(opt.price);
                    exteriorTotal += price;
                    lineItems.push({ category: 'Exterior', name: opt.name, price });
                }
            }
        });
    }
    optionsTotal += exteriorTotal;

    // --- Interior Options ---
    let interiorTotal = 0;
    if (config.interior) {
        ['seatMaterial', 'seatColor', 'dashboard', 'ambientLighting'].forEach(key => {
            if (config.interior[key]) {
                const opt = catalog.interiorOptions?.find(o => o.name === config.interior[key]);
                if (opt) {
                    const price = parseFloat(opt.price);
                    interiorTotal += price;
                    lineItems.push({ category: 'Interior', name: opt.name, price });
                }
            }
        });
    }
    optionsTotal += interiorTotal;

    // --- Wheels ---
    let wheelsPrice = 0;
    if (config.wheels) {
        const wheel = catalog.wheels?.find(w => w.name === config.wheels.name);
        if (wheel) {
            wheelsPrice = parseFloat(wheel.price);
            lineItems.push({ category: 'Wheels', name: wheel.name, price: wheelsPrice });
            optionsTotal += wheelsPrice;
        }
    }

    // --- Packages ---
    let packagesTotal = 0;
    if (config.packages && config.packages.length > 0) {
        config.packages.forEach(pkgName => {
            const pkg = catalog.packages?.find(p => p.name === pkgName);
            if (pkg) {
                const price = parseFloat(pkg.price);
                packagesTotal += price;
                lineItems.push({ category: 'Package', name: pkg.name, price });
            }
        });
    }
    optionsTotal += packagesTotal;

    // --- Incentives ---
    const incentives = [];

    // EV credit incentive
    if (config.engine === 'electric') {
        incentives.push({ name: 'EV Federal Tax Credit', amount: -7500 });
    }

    // Hybrid credit
    if (config.engine === 'hybrid') {
        incentives.push({ name: 'Hybrid Eco Credit', amount: -2500 });
    }

    const incentivesTotal = incentives.reduce((sum, i) => sum + i.amount, 0);

    // --- Grand Total ---
    const grandTotal = basePrice + optionsTotal + incentivesTotal;

    return {
        basePrice,
        enginePrice,
        transmissionPrice,
        trimPrice,
        exteriorTotal,
        interiorTotal,
        wheelsPrice,
        packagesTotal,
        optionsTotal,
        incentives,
        incentivesTotal,
        grandTotal,
        lineItems,
    };
}

module.exports = { calculatePricing };
