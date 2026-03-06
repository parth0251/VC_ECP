require('dotenv').config();
const express = require('express');
const cors = require('cors');

const modelsRouter = require('./routes/models');
const catalogRouter = require('./routes/catalog');
const configureRouter = require('./routes/configure');
const quotesRouter = require('./routes/quotes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/models', modelsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/configure', configureRouter);
app.use('/api/quotes', quotesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`ECP Server running on http://localhost:${PORT}`);
});

module.exports = app;
