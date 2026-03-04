import { useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { getCatalog, validateConfig, getConfigPricing } from '../services/api';

/**
 * Custom hook that wraps ConfigContext with API calls.
 * Handles fetching catalog, running validation, and computing pricing
 * automatically after each selection.
 */
export function useConfiguration() {
    const { state, actions } = useConfig();

    // Build the config object from current state for API calls
    const buildConfigPayload = useCallback(() => ({
        model: state.model?.name || null,
        engine: state.engine,
        transmission: state.transmission,
        trim: state.trim,
        exterior: state.exterior,
        interior: state.interior,
        wheels: state.wheels,
        packages: state.packages,
    }), [state]);

    // Fetch catalog for a model and run validation
    const loadCatalog = useCallback(async (modelId) => {
        try {
            actions.setLoading(true);
            const catalog = await getCatalog(modelId);
            actions.setCatalog(catalog);
            return catalog;
        } catch (err) {
            actions.setError(err.message);
            return null;
        } finally {
            actions.setLoading(false);
        }
    }, [actions]);

    // Validate current config against rule engine
    const validate = useCallback(async (configOverride) => {
        try {
            const config = configOverride || buildConfigPayload();
            const result = await validateConfig(config, state.market, state.catalog);
            actions.setRuleResult(result);
            return result;
        } catch (err) {
            actions.setError(err.message);
            return null;
        }
    }, [buildConfigPayload, state.market, state.catalog, actions]);

    // Calculate pricing
    const updatePricing = useCallback(async (configOverride) => {
        try {
            const config = configOverride || buildConfigPayload();
            const result = await getConfigPricing(config, state.catalog);
            actions.setPricingResult(result);
            return result;
        } catch (err) {
            actions.setError(err.message);
            return null;
        }
    }, [buildConfigPayload, state.catalog, actions]);

    // Combined: validate + price
    const validateAndPrice = useCallback(async (configOverride) => {
        const config = configOverride || buildConfigPayload();
        const [ruleResult, pricingResult] = await Promise.all([
            validate(config),
            updatePricing(config),
        ]);
        return { ruleResult, pricingResult };
    }, [buildConfigPayload, validate, updatePricing]);

    // Select model and load catalog
    const selectModel = useCallback(async (model) => {
        actions.setModel(model);
        actions.setEngine(null);
        actions.setTransmission(null);
        actions.setTrim(null);
        actions.setExterior({ paint: null, bodyKit: null, roofType: null });
        actions.setInterior({ seatMaterial: null, seatColor: null, dashboard: null, ambientLighting: null });
        actions.setWheels(null);
        actions.setPackages([]);
        const catalog = await loadCatalog(model.id);
        if (catalog) {
            const config = { model: model.name, engine: null, transmission: null, trim: null, exterior: {}, interior: {}, packages: [] };
            await validate(config);
        }
    }, [actions, loadCatalog, validate]);

    // Select engine, then validate + price
    const selectEngine = useCallback(async (engineType) => {
        actions.setEngine(engineType);
        const config = { ...buildConfigPayload(), engine: engineType };
        await validateAndPrice(config);
    }, [actions, buildConfigPayload, validateAndPrice]);

    // Select transmission, then validate + price
    const selectTransmission = useCallback(async (transType) => {
        actions.setTransmission(transType);
        const config = { ...buildConfigPayload(), transmission: transType };
        await validateAndPrice(config);
    }, [actions, buildConfigPayload, validateAndPrice]);

    // Select trim, then validate + price
    const selectTrim = useCallback(async (trimName) => {
        actions.setTrim(trimName);
        const config = { ...buildConfigPayload(), trim: trimName };
        await validateAndPrice(config);
    }, [actions, buildConfigPayload, validateAndPrice]);

    // Select exterior option, then validate + price
    const selectExterior = useCallback(async (key, value) => {
        const newExterior = { ...state.exterior, [key]: value };
        actions.setExterior({ [key]: value });
        const config = { ...buildConfigPayload(), exterior: newExterior };
        await validateAndPrice(config);
    }, [actions, state.exterior, buildConfigPayload, validateAndPrice]);

    // Select interior option, then validate + price
    const selectInterior = useCallback(async (key, value) => {
        const newInterior = { ...state.interior, [key]: value };
        actions.setInterior({ [key]: value });
        const config = { ...buildConfigPayload(), interior: newInterior };
        await validateAndPrice(config);
    }, [actions, state.interior, buildConfigPayload, validateAndPrice]);

    // Select wheels, then validate + price
    const selectWheels = useCallback(async (wheel) => {
        actions.setWheels(wheel);
        const config = { ...buildConfigPayload(), wheels: wheel };
        await validateAndPrice(config);
    }, [actions, buildConfigPayload, validateAndPrice]);

    // Toggle package, then validate + price
    const togglePackage = useCallback(async (pkgName) => {
        const current = state.packages || [];
        const newPackages = current.includes(pkgName)
            ? current.filter(p => p !== pkgName)
            : [...current, pkgName];
        actions.setPackages(newPackages);
        const config = { ...buildConfigPayload(), packages: newPackages };
        await validateAndPrice(config);
    }, [actions, state.packages, buildConfigPayload, validateAndPrice]);

    // Check if an option is disabled
    const isDisabled = useCallback((category, identifier) => {
        if (!state.ruleResult?.disabledOptions?.[category]) return false;
        return state.ruleResult.disabledOptions[category].some(d => d.id === identifier);
    }, [state.ruleResult]);

    // Get disable reason
    const getDisableReason = useCallback((category, identifier) => {
        if (!state.ruleResult?.disabledOptions?.[category]) return null;
        const found = state.ruleResult.disabledOptions[category].find(d => d.id === identifier);
        return found?.reason || null;
    }, [state.ruleResult]);

    return {
        state,
        actions,
        selectModel,
        selectEngine,
        selectTransmission,
        selectTrim,
        selectExterior,
        selectInterior,
        selectWheels,
        togglePackage,
        validate,
        updatePricing,
        validateAndPrice,
        isDisabled,
        getDisableReason,
        loadCatalog,
    };
}
