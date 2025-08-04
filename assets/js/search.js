// Search functionality for Apify store
class ApifySearch {
    constructor() {
        this.searchCache = new Map();
        this.searchTimeout = null;
        this.isSearching = false;
    }

    async searchActors(query, limit = 20, offset = 0) {
        if (!query || query.trim().length < 2) {
            return { items: [], total: 0, count: 0 };
        }

        const cacheKey = `${query.trim()}-${limit}-${offset}`;
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            this.isSearching = true;
            const response = await fetch(`/api/search/actors?query=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const results = await response.json();
            
            // Cache results for 5 minutes
            this.searchCache.set(cacheKey, results);
            setTimeout(() => this.searchCache.delete(cacheKey), 5 * 60 * 1000);
            
            return results;
        } catch (error) {
            console.error('Search error:', error);
            return { items: [], total: 0, count: 0, error: error.message };
        } finally {
            this.isSearching = false;
        }
    }

    async getActorDetails(userId, actorName) {
        const cacheKey = `details-${userId}/${actorName}`;
        
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            const response = await fetch(`/api/actors/${encodeURIComponent(userId)}/${encodeURIComponent(actorName)}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch actor: ${response.status}`);
            }

            const actor = await response.json();
            
            // Cache for 10 minutes
            this.searchCache.set(cacheKey, actor);
            setTimeout(() => this.searchCache.delete(cacheKey), 10 * 60 * 1000);
            
            return actor;
        } catch (error) {
            console.error('Actor fetch error:', error);
            return null;
        }
    }

    debouncedSearch(query, callback, delay = 300) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(async () => {
            const results = await this.searchActors(query);
            callback(results);
        }, delay);
    }

    async getPopularActors(limit = 20) {
        const cacheKey = `popular-${limit}`;
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            this.isSearching = true;
            // Get popular actors without search query - should return by popularity/usage
            const response = await fetch(`/api/popular/actors?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`Popular actors fetch failed: ${response.status}`);
            }

            const results = await response.json();
            
            // Cache results for 10 minutes
            this.searchCache.set(cacheKey, results);
            setTimeout(() => this.searchCache.delete(cacheKey), 10 * 60 * 1000);
            
            return results;
        } catch (error) {
            console.error('Popular actors error:', error);
            return { items: [], total: 0, count: 0, error: error.message };
        } finally {
            this.isSearching = false;
        }
    }

    clearCache() {
        this.searchCache.clear();
    }
}

// Create global search instance
window.apifySearch = new ApifySearch();