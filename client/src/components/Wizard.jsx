import { useConfiguration } from '../hooks/useConfiguration';
import Notifications from './Notifications';
import PricingSidebar from './PricingSidebar';
import ModelStep from './steps/ModelStep';
import EngineStep from './steps/EngineStep';
import TransmissionStep from './steps/TransmissionStep';
import TrimStep from './steps/TrimStep';
import ExteriorStep from './steps/ExteriorStep';
import InteriorStep from './steps/InteriorStep';
import WheelsStep from './steps/WheelsStep';
import PackagesStep from './steps/PackagesStep';
import ReviewStep from './steps/ReviewStep';

const STEPS = [
    { key: 'model', label: 'Model', icon: '🚗' },
    { key: 'engine', label: 'Engine', icon: '⚙️' },
    { key: 'transmission', label: 'Transmission', icon: '🔧' },
    { key: 'trim', label: 'Trim', icon: '✨' },
    { key: 'exterior', label: 'Exterior', icon: '🎨' },
    { key: 'interior', label: 'Interior', icon: '🪑' },
    { key: 'wheels', label: 'Wheels', icon: '🛞' },
    { key: 'packages', label: 'Packages', icon: '📦' },
    { key: 'review', label: 'Review', icon: '✅' },
];

export function Wizard() {
    const config = useConfiguration();
    const { state, actions } = config;
    const currentStep = state.currentStep;

    const canGoNext = () => {
        switch (currentStep) {
            case 0: return !!state.model;
            case 1: return !!state.engine;
            case 2: return !!state.transmission;
            case 3: return !!state.trim;
            default: return true;
        }
    };

    const goNext = () => {
        if (currentStep < STEPS.length - 1 && canGoNext()) {
            actions.setStep(currentStep + 1);
        }
    };

    const goBack = () => {
        if (currentStep > 0) {
            actions.setStep(currentStep - 1);
        }
    };

    const goToStep = (index) => {
        // Only allow going to completed steps or the current step
        if (index <= currentStep) {
            actions.setStep(index);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: return <ModelStep config={config} onNext={goNext} />;
            case 1: return <EngineStep config={config} />;
            case 2: return <TransmissionStep config={config} />;
            case 3: return <TrimStep config={config} />;
            case 4: return <ExteriorStep config={config} />;
            case 5: return <InteriorStep config={config} />;
            case 6: return <WheelsStep config={config} />;
            case 7: return <PackagesStep config={config} />;
            case 8: return <ReviewStep config={config} />;
            default: return null;
        }
    };

    return (
        <div className="wizard-layout">
            {/* Step progress bar */}
            <nav className="wizard-stepper">
                {STEPS.map((step, index) => (
                    <button
                        key={step.key}
                        className={`wizard-step-btn ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''} ${index > currentStep ? 'disabled' : ''}`}
                        onClick={() => goToStep(index)}
                        title={step.label}
                    >
                        <span className="wizard-step-icon">{index < currentStep ? '✓' : step.icon}</span>
                        <span className="wizard-step-label">{step.label}</span>
                    </button>
                ))}
            </nav>

            {/* Main content area */}
            <div className="wizard-content-wrapper">
                <div className="wizard-main">
                    {/* Step content */}
                    <div className="wizard-step-content animate-fade-in" key={currentStep}>
                        {renderStep()}
                    </div>

                    {/* Navigation buttons */}
                    {currentStep < 8 && (
                        <div className="wizard-nav">
                            <button className="btn btn-secondary" onClick={goBack} disabled={currentStep === 0}>
                                ← Back
                            </button>
                            <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* Pricing Sidebar */}
                <PricingSidebar pricing={state.pricingResult} visible={!!state.model} />
            </div>

            {/* Notifications */}
            <Notifications notifications={state.ruleResult?.notifications || []} />
        </div>
    );
}

export default Wizard;
