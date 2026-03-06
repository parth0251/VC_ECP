import React, { useEffect } from 'react';
import CarScene from '../components/3d/CarScene';
import ColorPicker from '../components/configurator/ColorPicker';
import ModelSelector from '../components/configurator/ModelSelector';
import RegionSelector from '../components/configurator/RegionSelector';
import EngineSelector from '../components/configurator/EngineSelector';
import GenericSelector from '../components/configurator/GenericSelector';
import useConfig3DStore from '../store/config3DStore';
import { createQuote, getCatalog } from '../services/api';

export default function Configurator3DPage() {
    const {
        step, setStep, setCatalog,
        modelPath, selectedColor, carData, market,
        selectedEngine, selectedTransmission, selectedTrim, selectedExterior,
        selectedInterior, selectedWheels, selectedPackages,
        setTransmission, setTrim, setExterior, setInterior, setWheels, togglePackage,
        pricingResult
    } = useConfig3DStore();

    useEffect(() => {
        if (carData) {
            getCatalog(carData.id || carData._id)
                .then(data => setCatalog(data))
                .catch(console.error);
        }
    }, [carData, setCatalog]);

    // The price comes from the centralized backend rule engine now
    const totalPrice = (pricingResult?.grandTotal || (carData ? Number(carData.base_price || 0) : 0)) + selectedColor.premium;

    const handleSave = async () => {
        if (!carData) return;
        try {
            const quoteData = {
                modelId: carData.id || carData._id,
                market: market,
                configType: '3d', // indicate this is a 3D configuration
                config: {
                    color: selectedColor.hex,
                    colorName: selectedColor.name,
                    engine: selectedEngine?.name,
                    transmission: selectedTransmission?.name,
                    trim: selectedTrim?.name,
                    exterior: selectedExterior?.name,
                    interior: selectedInterior?.name,
                    wheels: selectedWheels?.name,
                    packages: selectedPackages.map(p => p.name)
                },
                price: totalPrice,
                status: 'DRAFT'
            };

            const res = await createQuote(quoteData);
            alert('Configuration saved successfully! Quote ID: ' + (res.id || res._id || res.quoteNumber));
        } catch (err) {
            alert('Failed to save configuration: ' + err.message);
        }
    };

    return (
        <main style={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

            {/* 3D Canvas Fullscreen Background */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <CarScene
                    modelPath={modelPath || ''}
                    selectedColor={selectedColor.hex}
                    carType={carData?.name}
                />
            </div>

            {/* Floating UI Overlay (Progressive Steps) */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '320px',
                maxHeight: 'calc(100% - 40px)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                pointerEvents: 'none'
            }}
            >
                {step === 1 && (
                    <>
                        <div style={{ pointerEvents: 'auto' }}>
                            <RegionSelector />
                        </div>
                        <div style={{ pointerEvents: 'auto' }}>
                            <ModelSelector />
                        </div>
                        {carData && (
                            <div style={{ pointerEvents: 'auto' }}>
                                <ColorPicker />
                            </div>
                        )}
                    </>
                )}

                {step === 2 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <EngineSelector />
                    </div>
                )}
                {step === 3 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Transmission" catalogKey="transmissions" selectedItem={selectedTransmission} onSelect={setTransmission} />
                    </div>
                )}
                {step === 4 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Trim Level" catalogKey="trims" selectedItem={selectedTrim} onSelect={setTrim} />
                    </div>
                )}
                {step === 5 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Exterior Accessories" catalogKey="exteriorOptions" selectedItem={selectedExterior} onSelect={setExterior} />
                    </div>
                )}
                {step === 6 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Interior" catalogKey="interiorOptions" selectedItem={selectedInterior} onSelect={setInterior} />
                    </div>
                )}
                {step === 7 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Wheels" catalogKey="wheels" selectedItem={selectedWheels} onSelect={setWheels} />
                    </div>
                )}
                {step === 8 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <GenericSelector title="Packages" catalogKey="packages" selectedItem={selectedPackages} onSelect={togglePackage} />
                    </div>
                )}
                {step === 9 && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Review Summary</h3>
                            <ul style={{ paddingLeft: '1.5rem', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
                                <li><strong>Model:</strong> {carData?.name}</li>
                                <li><strong>Color:</strong> {selectedColor?.name} (+${selectedColor.premium})</li>
                                {selectedEngine && <li><strong>Engine:</strong> {selectedEngine.name} (+${selectedEngine.price})</li>}
                                {selectedTransmission && <li><strong>Trans:</strong> {selectedTransmission.name} (+${selectedTransmission.price})</li>}
                                {selectedTrim && <li><strong>Trim:</strong> {selectedTrim.name} (+${selectedTrim.price})</li>}
                                {selectedExterior && <li><strong>Exterior:</strong> {selectedExterior.name} (+${selectedExterior.price})</li>}
                                {selectedInterior && <li><strong>Interior:</strong> {selectedInterior.name} (+${selectedInterior.price})</li>}
                                {selectedWheels && <li><strong>Wheels:</strong> {selectedWheels.name} (+${selectedWheels.price})</li>}
                                {selectedPackages.map(p => <li key={p.id}><strong>Pkg:</strong> {p.name} (+${p.price})</li>)}

                                {pricingResult?.incentives?.length > 0 && (
                                    <>
                                        <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <div style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.85rem' }}>INCENTIVES APPLIED</div>
                                        {pricingResult.incentives.map((inc, i) => (
                                            <li key={i} style={{ color: 'var(--color-success)' }}>
                                                <strong>{inc.name}:</strong> -${Math.abs(inc.amount).toLocaleString()}
                                            </li>
                                        ))}
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Pricing and Save Panel */}
            {carData && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '24px',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    gap: '2rem',
                    alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    pointerEvents: 'auto',
                    minWidth: '400px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Step {step} of 9
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            ${totalPrice.toLocaleString()}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {step > 1 && (
                            <button
                                className="btn"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                                onClick={() => setStep(step - 1)}
                            >
                                ← Back
                            </button>
                        )}

                        {step < 9 ? (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '16px' }}
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 1 && !carData) ||
                                    (step === 2 && !selectedEngine) ||
                                    (step === 3 && !selectedTransmission) ||
                                    (step === 4 && !selectedTrim) ||
                                    (step === 5 && !selectedExterior) ||
                                    (step === 6 && !selectedInterior) ||
                                    (step === 7 && !selectedWheels)
                                }
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', background: 'var(--color-success)' }}
                                onClick={handleSave}
                            >
                                Save Configuration
                            </button>
                        )}
                    </div>
                </div>
            )}

        </main>
    );
}
