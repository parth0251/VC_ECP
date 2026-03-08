import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useConfig } from './context/ConfigContext';
import { getModels } from './services/api';
import ClassicConfiguratorPage from './pages/ClassicConfiguratorPage';
import Configurator3DPage from './pages/Configurator3DPage';
import SavedConfigurationsPage from './pages/SavedConfigurationsPage';
import ConfigDetailPage from './pages/ConfigDetailPage';
import './App.css';
import './styles/wizard.css';

function App() {
  const { state } = useConfig();
  const [models, setModels] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

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

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="app-logo">
            <div className="app-logo-icon">E</div>
            <span className="app-logo-text">ECP</span>
            {/* <span className="app-logo-badge">Enterprise Car Platform</span> */}
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {/* <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: 'none'
              })}
              end
            >
              Classic Configurator
            </NavLink> */}
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: 'none'
              })}
            >
              3D Configurator
            </NavLink>
            <NavLink
              to="/saved-configs"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: 'none',
                marginLeft: '1rem'
              })}
            >
              My Configurations
            </NavLink>
          </nav>
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

      <Routes>
        <Route path="/" element={<Configurator3DPage />} />
        <Route path="/3d-configurator" element={<Configurator3DPage />} />
        <Route path="/saved-configs" element={<SavedConfigurationsPage />} />
        <Route path="/config/:quoteId" element={<ConfigDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
