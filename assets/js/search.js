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
            
            // Debug: Log first few items to see what pricingModel values we're getting
            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log('API Response sample:', results.items.slice(0, 3).map(actor => ({
                title: actor.title,
                pricingModel: actor.pricingModel
            })));
            
            // Filter results to only include allowed pricing models
            const allowedPricingModels = ['FREE', 'PRICE_PER_DATASET_ITEM', 'PAY_PER_EVENT'];
            const filteredResults = {
                ...results,
                items: results.items.filter(actor => 
                    allowedPricingModels.includes(actor.pricingModel)
                ),
                count: results.items.filter(actor => 
                    allowedPricingModels.includes(actor.pricingModel)
                ).length
            };
            
            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log(`Filtered ${results.items.length} items down to ${filteredResults.items.length}`);
            
            // Cache filtered results for 5 minutes
            this.searchCache.set(cacheKey, filteredResults);
            setTimeout(() => this.searchCache.delete(cacheKey), 5 * 60 * 1000);
            
            return filteredResults;
        } catch (error) {
            console.error('Search error:', error);
            return { items: [], total: 0, count: 0, error: error.message };
        } finally {
            this.isSearching = false;
        }
    }

    // Removed getActorDetails: detailed actor endpoint no longer exists

    debouncedSearch(query, callback, delay = 300) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(async () => {
            const results = await this.searchActors(query);
            callback(results);
        }, delay);
    }

    async getPopularActorsPage(limit = 20, offset = 0) {
        const cacheKey = `popular-${limit}-${offset}`;
        
        // Check cache first
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }

        try {
            this.isSearching = true;
            // Get popular actors ordered by popularity with pagination
            const response = await fetch(`/api/popular/actors?limit=${limit}&offset=${offset}`);
            
            if (!response.ok) {
                throw new Error(`Popular actors fetch failed: ${response.status}`);
            }

            const results = await response.json();
            
            // Debug: Log first few items to see what pricingModel values we're getting
            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log('Popular API Response sample:', results.items.slice(0, 3).map(actor => ({
                title: actor.title,
                pricingModel: actor.pricingModel
            })));
            
            // Filter results to only include allowed pricing models
            const allowedPricingModels = ['FREE', 'PRICE_PER_DATASET_ITEM', 'PAY_PER_EVENT'];
            const filteredResults = {
                ...results,
                items: results.items.filter(actor => 
                    allowedPricingModels.includes(actor.pricingModel)
                ),
                count: results.items.filter(actor => 
                    allowedPricingModels.includes(actor.pricingModel)
                ).length
            };
            
            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log(`Popular: Filtered ${results.items.length} items down to ${filteredResults.items.length}`);
            
            // Cache filtered results for 10 minutes
            this.searchCache.set(cacheKey, filteredResults);
            setTimeout(() => this.searchCache.delete(cacheKey), 10 * 60 * 1000);
            
            return filteredResults;
        } catch (error) {
            console.error('Popular actors error:', error);
            return { items: [], total: 0, count: 0, error: error.message };
        } finally {
            this.isSearching = false;
        }
    }

    async getPopularActors(limit = 20) {
        return this.getPopularActorsPage(limit, 0);
    }

    clearCache() {
        this.searchCache.clear();
    }
}

// Create global search instance
window.apifySearch = new ApifySearch();