const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// For Node.js versions that don't have fetch globally
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// No APIFY token required: endpoints use public Store API

// Middleware
app.set('trust proxy', 1);
// Configure Helmet with a CSP that allows external images and CDNs we use
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "https:"],
            "script-src": ["'self'", "https:"],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": ["'self'", "https:", "'unsafe-inline'"],
            "font-src": ["'self'", "https:", "data:"],
            "connect-src": ["'self'", "https:"],
            "frame-ancestors": ["'self'"]
        }
    }
}));
app.use(compression());
app.use(express.json());

// Simple in-memory cache with TTL
const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        responseCache.delete(key);
        return null;
    }
    return entry.data;
}

function setCached(key, data) {
    responseCache.set(key, { timestamp: Date.now(), data });
}

// Dev-only: clear cache endpoint
if (process.env.NODE_ENV !== 'production') {
    app.post('/api/_dev/clear-cache', (req, res) => {
        responseCache.clear();
        res.status(204).end();
    });
}

// Rate limit API routes to protect backend/token
app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
}));

// Serve only the assets directory statically
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    dotfiles: 'ignore',
    immutable: true,
    maxAge: '7d',
}));

// Search endpoint for Apify store
app.get('/api/search/actors', async (req, res) => {
    try {
        const { query, limit = 50, offset = 0, pricingModel } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.json({ 
                items: [],
                total: 0,
                count: 0
            });
        }

        // Cache layer
        const cacheKey = `search:${query.trim().toLowerCase()}:l=${limit}:o=${offset}:p=${pricingModel || ''}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        // Use the Store API endpoint to get public actors - following exact docs format
        const storeParams = new URLSearchParams({
            limit: Math.min(parseInt(limit), 50), // Reduce from 1000 to 50 for better performance
            offset: parseInt(offset),
            search: query.trim(),
            sortBy: 'relevance',
        });

        const requestOptions = {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            redirect: "follow"
        };

        const response = await fetch(`https://api.apify.com/v2/store?${storeParams}`, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`Store API error: ${response.status} - ${errorText}`);
        }

        const searchResults = await response.json();
        
        // Store API returns data.items, not just items
        const paginatedItems = searchResults.data?.items || [];

        // Transform results to match our expected format
        const transformedItems = paginatedItems.map(actor => {
            
            return {
                id: actor.id,
                title: actor.title || actor.name,
                path: `${actor.username}/${actor.name}`,
                description: actor.description || '',
                icon: actor.pictureUrl || null, // Don't use fallback here, let frontend handle it
                pictureUrl: actor.pictureUrl || null,
                userPictureUrl: actor.userPictureUrl || null,
                username: actor.username,
                name: actor.name,
                pricingModel: actor.currentPricingInfo?.pricingModel,
                stats: {
                    totalUsers: actor.stats?.totalUsers || 0,
                    lastRunFinishedAt: actor.stats?.lastRunFinishedAt
                }
            };
        });

        const payload = {
            items: transformedItems,
            total: searchResults.data?.total || transformedItems.length,
            count: transformedItems.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        setCached(cacheKey, payload);
        res.json(payload);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Failed to search actors',
            message: error.message 
        });
    }
});

// Popular actors endpoint (no search, sorted by usage/popularity)
app.get('/api/popular/actors', async (req, res) => {
    try {
        const { limit = 20, offset = 0, pricingModel } = req.query;

        // Cache layer
        const cacheKey = `popular:l=${limit}:o=${offset}:p=${pricingModel || ''}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        // Get popular actors without search parameter, should return by popularity
        const storeParams = new URLSearchParams({
            limit: Math.min(parseInt(limit), 50),
            offset: parseInt(offset),
            sortBy: 'popularity',
            // No search parameter = should return popular/trending actors
        });

        const requestOptions = {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            redirect: "follow"
        };

        const response = await fetch(`https://api.apify.com/v2/store?${storeParams}`, requestOptions);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Popular actors API Error:', errorText);
            throw new Error(`Store API error: ${response.status} - ${errorText}`);
        }

        const searchResults = await response.json();
        const paginatedItems = searchResults.data?.items || [];

        // Transform results to match our expected format
        const transformedItems = paginatedItems.map(actor => {
            return {
                id: actor.id,
                title: actor.title || actor.name,
                path: `${actor.username}/${actor.name}`,
                description: actor.description || '',
                icon: actor.pictureUrl || null,
                pictureUrl: actor.pictureUrl || null,
                userPictureUrl: actor.userPictureUrl || null,
                username: actor.username,
                name: actor.name,
                pricingModel: actor.currentPricingInfo?.pricingModel,
                stats: {
                    totalUsers: actor.stats?.totalUsers || 0,
                    lastRunFinishedAt: actor.stats?.lastRunFinishedAt
                }
            };
        });

        const payload = {
            items: transformedItems,
            total: searchResults.data?.total || transformedItems.length,
            count: transformedItems.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        setCached(cacheKey, payload);
        res.json(payload);

    } catch (error) {
        console.error('Popular actors error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch popular actors',
            message: error.message 
        });
    }
});

// Detailed actor endpoint removed: only public store search/popular endpoints are supported

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve index.html for any other GET request (SPA fallback), excluding API and assets
app.get(/^(?!\/(api|assets)).*$/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Basic 404 handler for non-GET or unmatched routes
app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(port, () => {
    console.log(`Apify MCP Dashboard server running on http://localhost:${port}`);
});