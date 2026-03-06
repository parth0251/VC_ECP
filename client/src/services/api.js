const API_BASE = 'http://localhost:3001/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// ==================== Models ====================

export const getModels = () => apiFetch('/models');

export const getModelById = (id) => apiFetch(`/models/${id}`);

// ==================== Catalog ====================

export const getCatalog = (modelId) => apiFetch(`/catalog/${modelId}`);

// ==================== Configuration ====================

export const validateConfig = (config, market, catalog) =>
    apiFetch('/configure/validate', {
        method: 'POST',
        body: JSON.stringify({ config, market, catalog }),
    });

export const getConfigPricing = (config, catalog) =>
    apiFetch('/configure/price', {
        method: 'POST',
        body: JSON.stringify({ config, catalog }),
    });

// ==================== Quotes & Orders (Stage 3) ====================

export const createQuote = (data) =>
    apiFetch('/quotes', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const getQuotes = () => apiFetch('/quotes');
export const getQuote = (id) => apiFetch(`/quotes/${id}`);

export const createOrder = (data) =>
    apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const getOrder = (id) => apiFetch(`/orders/${id}`);
