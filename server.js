require('dotenv').config();
const express = require('express');
const path = require('path');
const { ApifyClient } = require('apify-client');

// For Node.js versions that don't have fetch globally
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Create Apify client with token from environment variable
if (!process.env.APIFY_TOKEN) {
    console.error('⚠️  APIFY_TOKEN environment variable is required!');
    console.error('Please set your Apify token in the .env file or environment variables.');
    process.exit(1);
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Search endpoint for Apify store
app.get('/api/search/actors', async (req, res) => {
    try {
        const { query, limit = 50, offset = 0 } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.json({ 
                items: [],
                total: 0,
                count: 0
            });
        }

        // Use the Store API endpoint to get public actors - following exact docs format
        const storeParams = new URLSearchParams({
            limit: Math.min(parseInt(limit), 50), // Reduce from 1000 to 50 for better performance
            offset: parseInt(offset),
            search: query.trim()
        });

        const requestOptions = {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.APIFY_TOKEN}`
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
                username: actor.username,
                name: actor.name,
                stats: {
                    totalRuns: actor.stats?.totalRuns || 0,
                    lastRunFinishedAt: actor.stats?.lastRunFinishedAt
                }
            };
        });

        res.json({
            items: transformedItems,
            total: searchResults.data?.total || transformedItems.length,
            count: transformedItems.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Failed to search actors',
            message: error.message 
        });
    }
});

// Get actor details
app.get('/api/actors/:userId/:actorName', async (req, res) => {
    try {
        const { userId, actorName } = req.params;
        const actorId = `${userId}/${actorName}`;
        
        const actor = await client.actor(actorId).get();
        
        if (!actor) {
            return res.status(404).json({ error: 'Actor not found' });
        }

        const transformedActor = {
            id: actor.id,
            title: actor.title || actor.name,
            path: `${actor.username}/${actor.name}`,
            description: actor.description || '',
            icon: actor.pictureUrl || 'assets/images/placeholder.svg',
            username: actor.username,
            name: actor.name,
            stats: {
                totalRuns: actor.stats?.totalRuns || 0,
                lastRunFinishedAt: actor.stats?.lastRunFinishedAt
            }
        };

        res.json(transformedActor);

    } catch (error) {
        console.error('Actor fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch actor details',
            message: error.message 
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Apify MCP Dashboard server running on http://localhost:${port}`);
});