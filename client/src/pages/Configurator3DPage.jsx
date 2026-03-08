import React, { useEffect, useState } from 'react';
import CarScene from '../components/3d/CarScene';
import ColorPicker from '../components/configurator/ColorPicker';
import ModelSelector from '../components/configurator/ModelSelector';
import RegionSelector from '../components/configurator/RegionSelector';
import EngineSelector from '../components/configurator/EngineSelector';
import DriveOrientationSelector from '../components/configurator/DriveOrientationSelector';
import GenericSelector from '../components/configurator/GenericSelector';
import useConfig3DStore from '../store/config3DStore';
import { createQuote, getCatalog } from '../services/api';

export default function Configurator3DPage() {
    const {
        step, setStep, setCatalog,
        modelPath, selectedColor, carData, market,
        selectedEngine, selectedTransmission, selectedTrim, selectedDriveOrientation, selectedExterior,
        selectedInterior, selectedWheels, selectedPackages,
        setTransmission, setTrim, setExterior, setInterior, setWheels, togglePackage,
        pricingResult
    } = useConfig3DStore();

    const [isRotating, setIsRotating] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle ESC to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

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
                    autoRotate={isRotating}
                />
            </div>

            {/* Top Right Controls (Always Visible) */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 50,
                display: 'flex',
                gap: '0.75rem',
                pointerEvents: 'auto'
            }}>
                <button
                    onClick={() => setIsRotating(!isRotating)}
                    title={isRotating ? "Pause 360° Rotation" : "Start 360° Rotation"}
                    style={{
                        background: isRotating ? 'var(--color-accent-subtle)' : 'rgba(0, 0, 0, 0.6)',
                        color: isRotating ? 'var(--color-text-accent)' : 'var(--color-text-primary)',
                        border: `1px solid ${isRotating ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-round)',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    {/* SVG Icon for 360 Rotation */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
                    style={{
                        background: isFullscreen ? 'var(--color-accent-subtle)' : 'rgba(0, 0, 0, 0.6)',
                        color: isFullscreen ? 'var(--color-text-accent)' : 'var(--color-text-primary)',
                        border: `1px solid ${isFullscreen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-round)',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    {/* SVG Icon for Full Screen */}
                    {isFullscreen ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Floating UI Overlay (Progressive Steps) - Hidden in Fullscreen */}
            {!isFullscreen && (
                <div style={{
                    position: 'absolute',
                    top: '80px', // Pushed down to clear the controls
                    right: '20px',
                    width: '320px',
                    maxHeight: 'calc(100% - 100px)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    pointerEvents: 'none',
                    zIndex: 40
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
                            <DriveOrientationSelector />
                        </div>
                    )}
                    {step === 5 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <GenericSelector title="Trim Level" catalogKey="trims" selectedItem={selectedTrim} onSelect={setTrim} />
                        </div>
                    )}
                    {step === 6 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <GenericSelector title="Exterior Accessories" catalogKey="exteriorOptions" selectedItem={selectedExterior} onSelect={setExterior} />
                        </div>
                    )}
                    {step === 7 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <GenericSelector title="Interior" catalogKey="interiorOptions" selectedItem={selectedInterior} onSelect={setInterior} />
                        </div>
                    )}
                    {step === 8 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <GenericSelector title="Wheels" catalogKey="wheels" selectedItem={selectedWheels} onSelect={setWheels} />
                        </div>
                    )}
                    {step === 9 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <GenericSelector title="Packages" catalogKey="packages" selectedItem={selectedPackages} onSelect={togglePackage} />
                        </div>
                    )}
                    {step === 10 && (
                        <div style={{ pointerEvents: 'auto' }}>
                            <div className="panel" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>Review Summary</h3>
                                <ul style={{ paddingLeft: '1.5rem', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    <li><strong>Model:</strong> {carData?.name}</li>
                                    <li><strong>Color:</strong> {selectedColor?.name} (+${selectedColor.premium})</li>
                                    {selectedEngine && <li><strong>Engine:</strong> {selectedEngine.name} (+${selectedEngine.price})</li>}
                                    {selectedTransmission && <li><strong>Trans:</strong> {selectedTransmission.name} (+${selectedTransmission.price})</li>}
                                    {selectedTrim && <li><strong>Trim:</strong> {selectedTrim.name} (+${selectedTrim.price})</li>}
                                    <li><strong>Drive:</strong> {selectedDriveOrientation === 'LHD' ? 'Left Hand Drive' : 'Right Hand Drive'}</li>
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
            )}

            {/* Pricing and Save Panel - Hidden in Fullscreen */}
            {carData && !isFullscreen && (
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
                            Step {step} of 10
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

                        {step < 10 ? (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '16px' }}
                                onClick={() => setStep(step + 1)}
                                disabled={
                                    (step === 1 && !carData) ||
                                    (step === 2 && !selectedEngine) ||
                                    (step === 3 && !selectedTransmission) ||
                                    (step === 4 && !selectedDriveOrientation) ||
                                    (step === 5 && !selectedTrim) ||
                                    (step === 6 && !selectedExterior) ||
                                    (step === 7 && !selectedInterior) ||
                                    (step === 8 && !selectedWheels)
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
