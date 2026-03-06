import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import Wizard from '../components/Wizard';

export default function ClassicConfiguratorPage({ models, apiStatus }) {
    const { state, actions } = useConfig();
    const [started, setStarted] = useState(false);

    // Once model is selected in the wizard, mark as started
    const showWizard = started || state.model;

    return (
        <main className="app-main container">
            {apiStatus === 'connected' ? (
                showWizard ? (
                    <Wizard />
                ) : (
                    <div className="hero">
                        <h1>Configure Your Dream Vehicle</h1>
                        <p>
                            Build your perfect car with our interactive configurator.
                            Real-time pricing, smart constraints, and a premium experience.
                        </p>
                        <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }} onClick={() => setStarted(true)}>
                            🚗 Start Configuring
                        </button>
                    </div>
                )
            ) : apiStatus === 'disconnected' ? (
                <div className="hero">
                    <h1>Configure Your Dream Vehicle</h1>
                    <p className="text-error">
                        ⚠ Cannot connect to API. Make sure the server is running on port 3001.
                    </p>
                </div>
            ) : (
                <div className="hero">
                    <h1>Configure Your Dream Vehicle</h1>
                    <p className="text-muted">Connecting to API...</p>
                </div>
            )}
        </main>
    );
}
