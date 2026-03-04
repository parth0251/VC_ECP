/**
 * Rule Engine — Pure function module.
 * Evaluates configuration constraints and returns validation results.
 *
 * All business logic is isolated here — no DB or HTTP dependencies.
 */

/**
 * Evaluate all configuration rules.
 *
 * @param {Object} config - Current configuration state
 * @param {string} config.model - Selected model name
 * @param {string} config.engine - Selected engine type (petrol, diesel, electric, hybrid, v8)
 * @param {string} config.transmission - Selected transmission type (manual, automatic)
 * @param {string} config.trim - Selected trim name (Base, Sport, Luxury)
 * @param {Object} config.exterior - { paint, bodyKit, roofType }
 * @param {Object} config.interior - { seatMaterial, seatColor, dashboard, ambientLighting }
 * @param {Object} config.wheels - Selected wheel option
 * @param {string[]} config.packages - Selected package names
 * @param {string} market - Market code (e.g. 'US-CA', 'EU-DE')
 * @param {Object} catalog - Full catalog data from DB
 *
 * @returns {{ valid: boolean, disabledOptions: Object, autoSelections: Object, notifications: string[] }}
 */
function evaluateRules(config, market, catalog) {
    const disabledOptions = {};
    const autoSelections = {};
    const notifications = [];

    // Helper to disable an option in a category
    const disable = (category, identifier, reason) => {
        if (!disabledOptions[category]) disabledOptions[category] = [];
        disabledOptions[category].push({ id: identifier, reason });
    };

    // Helper to auto-select an option
    const autoSelect = (category, value, reason) => {
        autoSelections[category] = { value, reason };
        notifications.push(reason);
    };

    // ========== MARKET-BASED EXCLUSIONS ==========
    if (market === 'US-CA') {
        disable('engine', 'diesel', 'Diesel engines are not available in California.');
    }

    // ========== MODEL-BASED EXCLUSIONS ==========
    if (config.model) {
        const modelName = config.model.toLowerCase();

        if (modelName === 'sedan') {
            disable('engine', 'v8', 'V8 engine is not available for the Sedan model.');
        }

        if (modelName === 'coupe') {
            disable('engine', 'diesel', 'Diesel engine is not available for the Coupe model.');
            disable('engine', 'hybrid', 'Hybrid engine is not available for the Coupe model.');
        }
    }

    // ========== ENGINE → TRANSMISSION FORCED SELECTION ==========
    if (config.engine === 'electric') {
        autoSelect('transmission', 'automatic', 'Electric drivetrain requires automatic transmission.');
        disable('transmission', 'manual', 'Manual transmission is not available with electric drivetrain.');
    }

    // ========== TRIM-BASED RULES ==========
    if (config.trim) {
        const trimName = config.trim.toLowerCase();

        // Sport trim → auto-include Sport Suspension
        if (trimName === 'sport') {
            autoSelect('suspension', 'sport', 'Sport trim includes Sport Suspension.');
        }

        // Base trim → exclude metallic paint
        if (trimName === 'base') {
            disable('paint', 'Mineral Grey Metallic', 'Metallic paint is not available with Base trim.');
            disable('paint', 'Sapphire Blue Metallic', 'Metallic paint is not available with Base trim.');
            disable('paint', 'Melbourne Red Metallic', 'Metallic paint is not available with Base trim.');
            disable('paint', 'Frozen Silver Matte', 'Matte/metallic paint is not available with Base trim.');
        }

        // Base trim → exclude Red interior
        if (trimName === 'base') {
            disable('seatColor', 'Red', 'Red interior is not available with Base trim.');
        }
    }

    // ========== EXTERIOR CROSS-DEPENDENCIES ==========
    if (config.exterior && config.exterior.roofType === 'Panoramic Sunroof') {
        disable('exterior', 'roof_rails', 'Roof rails are not compatible with panoramic sunroof.');
    }

    // Convertible soft-top only for Coupe
    if (config.model && config.model.toLowerCase() !== 'coupe') {
        disable('roofType', 'Convertible Soft-Top', 'Convertible roof is only available for the Coupe model.');
    }

    // Off-road body kit only for SUV
    if (config.model && config.model.toLowerCase() !== 'suv') {
        disable('bodyKit', 'Off-Road Body Kit', 'Off-road body kit is only available for SUV.');
    }

    // ========== WHEEL CONSTRAINTS ==========
    if (config.wheels && config.wheels.size === 21) {
        notifications.push('21-inch wheels are not compatible with snow chains.');
    }

    // Off-road wheels require SUV model
    if (config.model && config.model.toLowerCase() !== 'suv') {
        disable('wheels', 'Off-Road All-Terrain', 'Off-road wheels are only available for SUV models.');
    }

    // ========== PACKAGE CONSTRAINTS ==========
    if (config.engine === 'electric') {
        disable('packages', 'Tow Package', 'Tow Package is not available with electric drivetrain.');
    }

    // Winter Package → auto-includes
    if (config.packages && config.packages.includes('Winter Package')) {
        autoSelect('heatedSeats', true, 'Winter Package includes Heated Front Seats.');
        autoSelect('heatedSteering', true, 'Winter Package includes Heated Steering Wheel.');
    }

    // ========== VALIDATE CURRENT SELECTIONS ==========
    let valid = true;
    const currentSelectionIssues = [];

    // Check if current engine is disabled
    if (config.engine) {
        const engineDisabled = (disabledOptions['engine'] || []).find(
            d => d.id === config.engine
        );
        if (engineDisabled) {
            valid = false;
            currentSelectionIssues.push(`Engine "${config.engine}" is not available: ${engineDisabled.reason}`);
        }
    }

    // Check if current seat color is disabled
    if (config.interior && config.interior.seatColor) {
        const seatColorDisabled = (disabledOptions['seatColor'] || []).find(
            d => d.id === config.interior.seatColor
        );
        if (seatColorDisabled) {
            valid = false;
            currentSelectionIssues.push(`Seat color "${config.interior.seatColor}" is not available: ${seatColorDisabled.reason}`);
        }
    }

    // Check if current packages contain disabled ones
    if (config.packages) {
        config.packages.forEach(pkg => {
            const pkgDisabled = (disabledOptions['packages'] || []).find(
                d => d.id === pkg
            );
            if (pkgDisabled) {
                valid = false;
                currentSelectionIssues.push(`Package "${pkg}" is not available: ${pkgDisabled.reason}`);
            }
        });
    }

    if (currentSelectionIssues.length > 0) {
        notifications.push(...currentSelectionIssues);
    }

    return {
        valid,
        disabledOptions,
        autoSelections,
        notifications,
    };
}

module.exports = { evaluateRules };
