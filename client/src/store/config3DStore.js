import { create } from 'zustand';
import { validateConfig, getConfigPricing } from '../services/api';

export const COLOR_OPTIONS = [
    { name: 'Midnight Black', hex: '#0a0a0a', premium: 0 },
    { name: 'Arctic White', hex: '#f5f5f0', premium: 0 },
    { name: 'Velocity Red', hex: '#cc1a1a', premium: 500 },
    { name: 'Ocean Blue', hex: '#1a4a8a', premium: 500 },
    { name: 'Forest Green', hex: '#1a4a2a', premium: 500 },
    { name: 'Champagne Gold', hex: '#c8a86b', premium: 1200 },
    { name: 'Matte Graphite', hex: '#3d3d3d', premium: 1500 },
    { name: 'Pearl Titanium', hex: '#8a8a8a', premium: 2000 },
];

const useConfig3DStore = create((set, get) => ({
    // Multi-step Flow
    step: 1, // 1: Model/Color, 2: Engine/Options
    catalog: null,

    // Car selection
    selectedCarId: null,
    carData: null,
    modelPath: '/models/ferrari.glb', // default realistic model

    // Visual options
    selectedColor: COLOR_OPTIONS[0],
    selectedAccessories: [],
    selectedEngine: null,
    selectedTransmission: null,
    selectedTrim: null,
    selectedDriveOrientation: 'LHD', // Default Left Hand Drive
    selectedExterior: null,
    selectedInterior: null,
    selectedWheels: null,
    selectedPackages: [],

    // Validation Results
    ruleResult: null,
    pricingResult: null,
    market: 'US-CA', // Set to California to enforce PRD emission constraint default

    // Actions
    setMarket: (market) => {
        set({ market });
        get().runValidation({});
    },
    setStep: (step) => set({ step }),
    setCatalog: (catalog) => {
        set({ catalog });
        get().runValidation({});
    },

    runValidation: async (newState) => {
        const state = get();
        const extOpt = newState.selectedExterior !== undefined ? newState.selectedExterior : state.selectedExterior;

        const configToValidate = {
            model: state.carData?.name || null,
            engine: newState.selectedEngine?.name || state.selectedEngine?.name,
            transmission: newState.selectedTransmission?.name || state.selectedTransmission?.name,
            trim: newState.selectedTrim?.name || state.selectedTrim?.name,
            exterior: {
                paint: state.selectedColor?.name,
                bodyKit: extOpt?.category === 'body_kit' ? extOpt.name : undefined,
                roofType: extOpt?.category === 'roof_type' ? extOpt.name : undefined
            },
            interior: {
                seatMaterial: newState.selectedInterior?.name || state.selectedInterior?.name,
                driveOrientation: newState.selectedDriveOrientation || state.selectedDriveOrientation
            },
            wheels: { name: newState.selectedWheels?.name || state.selectedWheels?.name },
            packages: newState.selectedPackages ? newState.selectedPackages.map(p => p.name) : state.selectedPackages.map(p => p.name)
        };

        try {
            let [valResult, priceResult] = await Promise.all([
                validateConfig(configToValidate, state.market, state.catalog),
                getConfigPricing(configToValidate, state.catalog)
            ]);

            // Reactively clear the selected engine if it has become disabled (e.g. market changed to CA)
            let engineCleared = false;
            if (state.selectedEngine && valResult?.disabledOptions?.engine) {
                const isEngineDisabled = valResult.disabledOptions.engine.find(
                    d => d.id === state.selectedEngine.type || d.id === state.selectedEngine.name
                );
                // If it is disabled, we clear it and must re-calculate the price
                if (isEngineDisabled) {
                    engineCleared = true;
                    configToValidate.engine = null;
                }
            }

            if (engineCleared) {
                priceResult = await getConfigPricing(configToValidate, state.catalog);
                set({ ruleResult: valResult, pricingResult: priceResult, selectedEngine: null });
            } else {
                set({ ruleResult: valResult, pricingResult: priceResult });
            }
        } catch (error) {
            console.error('Validation or pricing failed', error);
        }
    },

    setEngine: (engine) => {
        set({ selectedEngine: engine });
        get().runValidation({ selectedEngine: engine });
    },
    setTransmission: (transmission) => {
        set({ selectedTransmission: transmission });
        get().runValidation({ selectedTransmission: transmission });
    },
    setTrim: (trim) => {
        set({ selectedTrim: trim });
        get().runValidation({ selectedTrim: trim });
    },
    setDriveOrientation: (orientation) => {
        set({ selectedDriveOrientation: orientation });
        get().runValidation({ selectedDriveOrientation: orientation });
    },
    setExterior: (exterior) => {
        set({ selectedExterior: exterior });
        get().runValidation({ selectedExterior: exterior });
    },
    setInterior: (interior) => {
        set({ selectedInterior: interior });
        get().runValidation({ selectedInterior: interior });
    },
    setWheels: (wheels) => {
        set({ selectedWheels: wheels });
        get().runValidation({ selectedWheels: wheels });
    },
    togglePackage: (pkg) => {
        const state = get();
        const pId = pkg.id;
        const exists = state.selectedPackages.find(p => p.id === pId);

        let newPackages = [];
        if (exists) {
            newPackages = state.selectedPackages.filter(p => p.id !== pId);
        } else {
            newPackages = [...state.selectedPackages, pkg];
        }

        set({ selectedPackages: newPackages });
        get().runValidation({ selectedPackages: newPackages });
    },
    setCarData: (car) => set({
        selectedCarId: car.id || car._id,
        carData: car,
        modelPath: '/models/ferrari.glb',
        selectedEngine: null,
        selectedTransmission: null,
        selectedTrim: null,
        selectedDriveOrientation: 'LHD',
        selectedExterior: null,
        selectedInterior: null,
        selectedWheels: null,
        selectedPackages: [],
        ruleResult: null,
        pricingResult: null,
        step: 1 // reset step
    }),
    setColor: (colorObj) => {
        set({ selectedColor: colorObj });
        get().runValidation({});
    },
    toggleAccessory: (accId) => set(state => ({
        selectedAccessories: state.selectedAccessories.includes(accId)
            ? state.selectedAccessories.filter(id => id !== accId)
            : [...state.selectedAccessories, accId],
    })),
}));

export default useConfig3DStore;
