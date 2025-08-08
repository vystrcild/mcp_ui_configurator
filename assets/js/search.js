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
            const storeParams = new URLSearchParams({
                search: query.trim(),
                limit: String(limit),
                offset: String(offset),
                sortBy: 'relevance'
            });
            const response = await fetch(`https://api.apify.com/v2/store?${storeParams.toString()}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Search failed: ${response.status}`);

            const raw = await response.json();
            const paginatedItems = raw?.data?.items || [];
            const transformed = paginatedItems.map(actor => {
                const ratingCandidates = [actor.actorReviewRating, actor.stats?.avgRating, actor.avgRating, actor.rating];
                const firstFinite = ratingCandidates.map(Number).find(n => Number.isFinite(n));
                const normalizedRating = Number.isFinite(firstFinite) ? firstFinite : null;
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
                    actorReviewRating: normalizedRating,
                    stats: {
                        totalUsers: actor.stats?.totalUsers || 0,
                        lastRunFinishedAt: actor.stats?.lastRunFinishedAt,
                        avgRating: normalizedRating
                    }
                };
            });

            const results = {
                items: transformed,
                total: raw?.data?.total || transformed.length,
                count: transformed.length,
                limit,
                offset
            };

            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log('API Response sample:', results.items.slice(0, 3).map(actor => ({
                title: actor.title,
                pricingModel: actor.pricingModel,
                actorReviewRating: actor.actorReviewRating,
                totalUsers: actor.stats?.totalUsers
            })));

            const allowedPricingModels = ['FREE', 'PRICE_PER_DATASET_ITEM', 'PAY_PER_EVENT'];
            const filteredResults = {
                ...results,
                items: results.items.filter(actor => allowedPricingModels.includes(actor.pricingModel)),
                count: results.items.filter(actor => allowedPricingModels.includes(actor.pricingModel)).length
            };

            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log(`Filtered ${results.items.length} items down to ${filteredResults.items.length}`);

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
            const storeParams = new URLSearchParams({
                limit: String(limit),
                offset: String(offset),
                sortBy: 'popularity'
            });
            const response = await fetch(`https://api.apify.com/v2/store?${storeParams.toString()}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Popular actors fetch failed: ${response.status}`);

            const raw = await response.json();
            const paginatedItems = raw?.data?.items || [];
            const transformed = paginatedItems.map(actor => {
                const ratingCandidates = [actor.actorReviewRating, actor.stats?.avgRating, actor.avgRating, actor.rating];
                const firstFinite = ratingCandidates.map(Number).find(n => Number.isFinite(n));
                const normalizedRating = Number.isFinite(firstFinite) ? firstFinite : null;
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
                    actorReviewRating: normalizedRating,
                    stats: {
                        totalUsers: actor.stats?.totalUsers || 0,
                        lastRunFinishedAt: actor.stats?.lastRunFinishedAt,
                        avgRating: normalizedRating
                    }
                };
            });

            const results = {
                items: transformed,
                total: raw?.data?.total || transformed.length,
                count: transformed.length,
                limit,
                offset
            };

            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log('Popular API Response sample:', results.items.slice(0, 3).map(actor => ({
                title: actor.title,
                pricingModel: actor.pricingModel,
                actorReviewRating: actor.actorReviewRating,
                totalUsers: actor.stats?.totalUsers
            })));

            const allowedPricingModels = ['FREE', 'PRICE_PER_DATASET_ITEM', 'PAY_PER_EVENT'];
            const filteredResults = {
                ...results,
                items: results.items.filter(actor => allowedPricingModels.includes(actor.pricingModel)),
                count: results.items.filter(actor => allowedPricingModels.includes(actor.pricingModel)).length
            };

            if (typeof window !== 'undefined' && window.__DEBUG__ !== false) console.log(`Popular: Filtered ${results.items.length} items down to ${filteredResults.items.length}`);

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