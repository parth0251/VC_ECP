import { useEffect, useState } from 'react';
import { useConfig } from './context/ConfigContext';
import { getModels } from './services/api';
import Wizard from './components/Wizard';
import './App.css';
import './styles/wizard.css';

function App() {
  const { state, actions } = useConfig();
  const [models, setModels] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const data = await getModels();
        setModels(data);
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }
    }
    init();
  }, []);

  // Once model is selected in the wizard, mark as started
  const showWizard = started || state.model;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">E</div>
          <span className="app-logo-text">ECP</span>
          <span className="app-logo-badge">Enterprise Car Platform</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
            Market: {state.market}
          </span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: apiStatus === 'connected' ? 'var(--color-success)' : 'var(--color-error)',
            }}
            title={apiStatus === 'connected' ? 'API Connected' : 'API Disconnected'}
          />
        </div>
      </header>

      {/* Main Content */}
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
    </div>
  );
}

export default App;
