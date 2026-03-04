import { createContext, useContext, useReducer, useCallback } from 'react';

const ConfigContext = createContext(null);

const initialState = {
    // Current selections
    model: null,         // { id, name, base_price }
    engine: null,        // engine type string (e.g. 'petrol')
    transmission: null,  // transmission type string (e.g. 'automatic')
    trim: null,          // trim name string (e.g. 'Sport')
    exterior: {
        paint: null,
        bodyKit: null,
        roofType: null,
    },
    interior: {
        seatMaterial: null,
        seatColor: null,
        dashboard: null,
        ambientLighting: null,
    },
    wheels: null,          // { name, size }
    packages: [],          // array of package name strings

    // Market
    market: 'US-GEN',

    // Catalog data (loaded from API)
    catalog: null,

    // Engine results (computed after each selection)
    ruleResult: null,      // { valid, disabledOptions, autoSelections, notifications }
    pricingResult: null,   // { basePrice, optionsTotal, ..., grandTotal, lineItems }

    // UI state
    currentStep: 0,
    loading: false,
    error: null,
};

function configReducer(state, action) {
    switch (action.type) {
        case 'SET_MODEL':
            return {
                ...initialState,
                market: state.market,
                model: action.payload,
                currentStep: state.currentStep,
            };

        case 'SET_ENGINE':
            return { ...state, engine: action.payload };

        case 'SET_TRANSMISSION':
            return { ...state, transmission: action.payload };

        case 'SET_TRIM':
            return {
                ...state,
                trim: action.payload,
                // Trim change may invalidate interior/exterior — let rule engine handle
            };

        case 'SET_EXTERIOR':
            return {
                ...state,
                exterior: { ...state.exterior, ...action.payload },
            };

        case 'SET_INTERIOR':
            return {
                ...state,
                interior: { ...state.interior, ...action.payload },
            };

        case 'SET_WHEELS':
            return { ...state, wheels: action.payload };

        case 'SET_PACKAGES':
            return { ...state, packages: action.payload };

        case 'SET_MARKET':
            return { ...state, market: action.payload };

        case 'SET_CATALOG':
            return { ...state, catalog: action.payload };

        case 'SET_RULE_RESULT':
            return { ...state, ruleResult: action.payload };

        case 'SET_PRICING_RESULT':
            return { ...state, pricingResult: action.payload };

        case 'SET_STEP':
            return { ...state, currentStep: action.payload };

        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'RESET':
            return { ...initialState, market: state.market };

        default:
            return state;
    }
}

export function ConfigProvider({ children }) {
    const [state, dispatch] = useReducer(configReducer, initialState);

    const setModel = useCallback((model) => dispatch({ type: 'SET_MODEL', payload: model }), []);
    const setEngine = useCallback((engine) => dispatch({ type: 'SET_ENGINE', payload: engine }), []);
    const setTransmission = useCallback((t) => dispatch({ type: 'SET_TRANSMISSION', payload: t }), []);
    const setTrim = useCallback((trim) => dispatch({ type: 'SET_TRIM', payload: trim }), []);
    const setExterior = useCallback((ext) => dispatch({ type: 'SET_EXTERIOR', payload: ext }), []);
    const setInterior = useCallback((int) => dispatch({ type: 'SET_INTERIOR', payload: int }), []);
    const setWheels = useCallback((wheels) => dispatch({ type: 'SET_WHEELS', payload: wheels }), []);
    const setPackages = useCallback((pkgs) => dispatch({ type: 'SET_PACKAGES', payload: pkgs }), []);
    const setMarket = useCallback((market) => dispatch({ type: 'SET_MARKET', payload: market }), []);
    const setCatalog = useCallback((catalog) => dispatch({ type: 'SET_CATALOG', payload: catalog }), []);
    const setRuleResult = useCallback((res) => dispatch({ type: 'SET_RULE_RESULT', payload: res }), []);
    const setPricingResult = useCallback((res) => dispatch({ type: 'SET_PRICING_RESULT', payload: res }), []);
    const setStep = useCallback((step) => dispatch({ type: 'SET_STEP', payload: step }), []);
    const setLoading = useCallback((val) => dispatch({ type: 'SET_LOADING', payload: val }), []);
    const setError = useCallback((err) => dispatch({ type: 'SET_ERROR', payload: err }), []);
    const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

    const value = {
        state,
        actions: {
            setModel,
            setEngine,
            setTransmission,
            setTrim,
            setExterior,
            setInterior,
            setWheels,
            setPackages,
            setMarket,
            setCatalog,
            setRuleResult,
            setPricingResult,
            setStep,
            setLoading,
            setError,
            reset,
        },
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}

export default ConfigContext;
