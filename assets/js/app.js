// Tools data
const TOOLS_DATA = [
    {
        id: 'tool_actor_discovery',
        name: 'Actor discovery and management',
        description: 'Search for Actors, view details, and dynamically add them to your server.',
        category: 'default'
    },
    {
        id: 'tool_apify_docs',
        name: 'Apify documentation',
        description: 'Search Apify documentation and fetch specific documents for development help.',
        category: 'optional'
    },
    {
        id: 'tool_actor_runs',
        name: 'Actor runs',
        description: 'Monitor and manage your Actor executions, view results, and access logs.',
        category: 'optional'
    },
    {
        id: 'tool_apify_storage',
        name: 'Apify storage',
        description: 'Access and manage your data stored in Apify\'s datasets and key-value stores.',
        category: 'optional'
    }
];

// Global state
let selectedActors = [];
let selectedTools = ['tool_actor_discovery']; // Actor discovery selected by default
let enableDynamicActors = true;
let useToken = false;
let modalSelection = [];
let filteredActors = [];
let searchResults = [];
let isUsingSearch = false;
let activeTab = "configuration";

// DOM Elements
const elements = {
    selectedActors: document.getElementById('selectedActors'),
    toolsGrid: document.getElementById('toolsGrid'),
    serverUrl: document.getElementById('serverUrl'),
    serverConfig: document.getElementById('serverConfig'),
    actorModalOverlay: document.getElementById('actorModalOverlay'),
    actorsGrid: document.getElementById('actorsGrid'),
    actorSearch: document.getElementById('actorSearch'),
    enableDynamicActors: document.getElementById('enableDynamicActors'),
    useToken: document.getElementById('useToken')
};

// Initialize the app
function init() {
    setupEventListeners();
    renderSelectedActors();
    renderToolsGrid();
    updateServerConfig();
    // Note: renderActorsGrid() is not called here since modal will load data when opened
}

// Event Listeners
function setupEventListeners() {
    // Add actors button
    document.getElementById('addActorsBtn').addEventListener('click', openActorModal);
    
    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Actor search with debouncing
    elements.actorSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            // Load popular actors when search is empty
            isUsingSearch = true;
            showSearchLoading();
            window.apifySearch.getPopularActors(20).then(results => {
                if (results.items && results.items.length > 0) {
                    searchResults = results.items;
                    renderActorsGrid();
                } else {
                    showEmptyState();
                }
            }).catch(() => {
                showSearchError('Failed to load actors');
            });
        } else if (query.length >= 2) {
            // Use real search for queries with 2+ characters
            isUsingSearch = true;
            showSearchLoading();
            
            window.apifySearch.debouncedSearch(query, (results) => {
                if (results.error) {
                    showSearchError(results.error);
                } else {
                    searchResults = results.items;
                    renderActorsGrid();
                }
            });
        } else {
            // For single character, show loading and search
            isUsingSearch = true;
            showSearchLoading();
            window.apifySearch.debouncedSearch(query, (results) => {
                if (results.error) {
                    showSearchError(results.error);
                } else {
                    searchResults = results.items;
                    renderActorsGrid();
                }
            });
        }
    });
    
    // Dynamic actors checkbox
    elements.enableDynamicActors.addEventListener('change', (e) => {
        enableDynamicActors = e.target.checked;
        updateServerConfig();
    });
    
    // Use token checkbox
    elements.useToken.addEventListener('change', (e) => {
        useToken = e.target.checked;
        updateServerConfig();
        updateAuthDescription();
    });
    
    // Close modal when clicking overlay
    elements.actorModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.actorModalOverlay) {
            closeActorModal();
        }
    });
}

// Rendering functions
function renderSelectedActors() {
    if (selectedActors.length === 0) {
        elements.selectedActors.innerHTML = `
            <div class="empty-state">
                <p>No Actors selected.</p>
            </div>
        `;
        return;
    }
    
    elements.selectedActors.innerHTML = '';
    elements.selectedActors.className = 'selected-actors';
    
    selectedActors.forEach(actor => {
        const actorCard = document.createElement('div');
        actorCard.className = 'selected-actor-card';
        
        actorCard.innerHTML = `
            <button class="btn btn-ghost btn-icon remove-actor-btn" onclick="removeActor('${actor.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <span class="sr-only">Remove Actor</span>
            </button>
            <div class="selected-actor-content">
                <img src="${actor.icon || 'assets/images/placeholder.svg'}" alt="${actor.title}" class="selected-actor-icon">
                <div class="selected-actor-info">
                    <p class="selected-actor-title">${actor.title}</p>
                    <p class="selected-actor-path">${actor.path}</p>
                </div>
            </div>
        `;
        
        elements.selectedActors.appendChild(actorCard);
    });
}

function renderToolsGrid() {
    elements.toolsGrid.innerHTML = '';
    
    // Default Tools Section
    const defaultSection = document.createElement('div');
    defaultSection.className = 'tools-section';
    defaultSection.innerHTML = `
        <h4 class="tools-section-title">Default Tools</h4>
        <p class="tools-section-description">These tools are always available and cannot be disabled.</p>
    `;
    
    const defaultTools = TOOLS_DATA.filter(tool => tool.category === 'default');
    defaultTools.forEach(tool => {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item default';
        toolItem.innerHTML = `
            <div class="tool-checkbox">
                <input type="checkbox" checked disabled>
                <span class="checkmark"></span>
            </div>
            <div class="tool-content">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.description}</div>
            </div>
        `;
        defaultSection.appendChild(toolItem);
    });
    
    elements.toolsGrid.appendChild(defaultSection);
    
    // Optional Tools Section
    const optionalSection = document.createElement('div');
    optionalSection.className = 'tools-section';
    optionalSection.innerHTML = `
        <h4 class="tools-section-title">Optional Tools</h4>
        <p class="tools-section-description">These tools must be explicitly enabled and will be included in the server configuration.</p>
    `;
    
    const optionalTools = TOOLS_DATA.filter(tool => tool.category === 'optional');
    optionalTools.forEach(tool => {
        const isSelected = selectedTools.includes(tool.id);
        
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item optional';
        toolItem.onclick = () => toggleTool(tool.id);
        toolItem.innerHTML = `
            <div class="tool-checkbox">
                <input type="checkbox" ${isSelected ? 'checked' : ''}>
                <span class="checkmark"></span>
            </div>
            <div class="tool-content">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-description">${tool.description}</div>
            </div>
        `;
        optionalSection.appendChild(toolItem);
    });
    
    elements.toolsGrid.appendChild(optionalSection);
}

function renderActorsGrid() {
    console.log('renderActorsGrid called');
    console.log('isUsingSearch:', isUsingSearch);
    console.log('searchResults:', searchResults);
    console.log('filteredActors:', filteredActors);
    
    elements.actorsGrid.innerHTML = '';
    
    const actorsToRender = isUsingSearch ? searchResults : filteredActors;
    console.log('actorsToRender:', actorsToRender.length, 'items');
    
    if (actorsToRender.length === 0) {
        console.log('Showing empty state');
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-search-state';
        emptyState.innerHTML = `
            <p>${isUsingSearch ? 'No Actors found matching your search.' : 'No Actors available.'}</p>
            ${isUsingSearch ? '<p class="text-sm text-muted-foreground">Try different keywords or check your spelling.</p>' : ''}
        `;
        elements.actorsGrid.appendChild(emptyState);
        return;
    }
    
    actorsToRender.forEach(actor => {
        const isSelected = modalSelection.some(a => a.id === actor.id);
        
        const actorCard = document.createElement('div');
        actorCard.className = `actor-modal-card ${isSelected ? 'selected' : ''}`;
        actorCard.onclick = () => toggleActorSelection(actor);
        
        // Format user count similar to Apify Store
        const formatUserCount = (count) => {
            if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
            if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
            return count?.toString() || '0';
        };

        // Get company info and rating
        const companyName = actor.username || 'Unknown User';
        const companyLogo = actor.userPictureUrl || actor.userAvatar || actor.avatar || 'assets/images/placeholder-user.jpg';
        const rating = actor.stats?.avgRating || (4.0 + Math.random() * 1.0);
        const userCount = actor.stats?.totalUsers || Math.floor(Math.random() * 200000);
        const description = actor.description || actor.title;

        // Debug logging - show complete actor object structure
        console.log('Full actor object:', actor);
        console.log('Actor image fields:', {
            title: actor.title,
            pictureUrl: actor.pictureUrl,
            userPictureUrl: actor.userPictureUrl,
            icon: actor.icon,
            avatar: actor.avatar,
            userAvatar: actor.userAvatar,
            image: actor.image,
            logo: actor.logo,
            username: actor.username
        });

        const iconHtml = actor.pictureUrl || actor.icon ? 
            `<img src="${actor.pictureUrl || actor.icon}" alt="${actor.title}" class="actor-icon">` :
            `<img src="assets/images/placeholder.svg" alt="${actor.title}" class="actor-icon">`;

        actorCard.innerHTML = `
            <div class="actor-card-header">
                <div class="actor-card-icon">
                    ${iconHtml}
                </div>
                <div class="actor-card-title-section">
                    <h4 class="actor-card-title">${actor.title}</h4>
                    <p class="actor-card-path">${actor.path}</p>
                </div>
            </div>
            <div class="actor-card-description">
                <p>${description}</p>
            </div>
            <div class="actor-card-footer">
                <div class="actor-card-company">
                    <img src="${companyLogo}" alt="${companyName}" class="company-logo">
                    <span class="company-name">${companyName}</span>
                </div>
                <div class="actor-card-stats">
                    <span class="run-count">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${formatUserCount(userCount)}
                    </span>
                    <span class="rating">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26 6.91 1-5 4.87 1.18 6.87-6.18-3.25-6.18 3.25 1.18-6.87-5-4.87 6.91-1z"/>
                        </svg>
                        ${rating.toFixed(1)}
                    </span>
                </div>
            </div>
        `;
        
        elements.actorsGrid.appendChild(actorCard);
    });
}

// Actor management
async function openActorModal() {
    modalSelection = [...selectedActors];
    elements.actorModalOverlay.classList.add('active');
    
    // Load popular actors by default (all actors ordered by usage)
    showSearchLoading();
    try {
        const results = await window.apifySearch.getPopularActors(20);
        console.log('Modal got results:', results);
        if (results.items && results.items.length > 0) {
            searchResults = results.items;
            isUsingSearch = true;
            console.log('About to render grid with:', searchResults.length, 'items');
            renderActorsGrid();
        } else {
            console.log('No items found, showing empty state');
            showEmptyState();
        }
    } catch (error) {
        console.error('Modal error:', error);
        showSearchError('Failed to load actors');
    }
}

function closeActorModal() {
    elements.actorModalOverlay.classList.remove('active');
    elements.actorSearch.value = '';
    filteredActors = [];
    searchResults = [];
    isUsingSearch = false;
}

function toggleActorSelection(actor) {
    const isSelected = modalSelection.some(a => a.id === actor.id);
    
    if (isSelected) {
        modalSelection = modalSelection.filter(a => a.id !== actor.id);
    } else {
        modalSelection.push(actor);
    }
    
    renderActorsGrid();
}

function saveActorSelection() {
    selectedActors = [...modalSelection];
    renderSelectedActors();
    updateServerConfig();
    closeActorModal();
}

function removeActor(actorId) {
    selectedActors = selectedActors.filter(a => a.id !== actorId);
    renderSelectedActors();
    updateServerConfig();
}


// Tool management
function toggleTool(toolId) {
    const isSelected = selectedTools.includes(toolId);
    
    if (isSelected) {
        selectedTools = selectedTools.filter(id => id !== toolId);
    } else {
        selectedTools.push(toolId);
    }
    
    renderToolsGrid();
    updateServerConfig();
}

// Configuration generation
function generateServerConfig() {
    const serverName = "Apify-mcp-server";
    
    const toolMapping = {
        tool_apify_docs: "docs",
        tool_actor_runs: "runs",
        tool_apify_storage: "storage",
    };
    
    const mappedTools = selectedTools
        .map(toolId => toolMapping[toolId])
        .filter((tool, index, arr) => tool && arr.indexOf(tool) === index);
    
    const toolsArg = mappedTools.length > 0 ? `--tools=${mappedTools.join(",")}` : "";
    const actorsArg = selectedActors.length > 0 ? `--actors=${selectedActors.map((a) => a.path).join(",")}` : "";
    
    const additionalArgs = [actorsArg, toolsArg].filter((arg) => arg !== "");
    const args = ["-y", "@apify/actors-mcp-server", ...additionalArgs];
    
    const config = {
        mcpServers: {
            [serverName]: {
                command: "npx",
                args: args,
                ...(useToken && {
                    env: {
                        APIFY_TOKEN: "YOUR_APIFY_TOKEN",
                    },
                }),
            },
        },
    };
    
    return JSON.stringify(config, null, 2);
}

function generateMcpUrl() {
    const baseUrl = "https://mcp.apify.com/";
    const params = new URLSearchParams();
    
    if (enableDynamicActors === false) {
        params.append("enableAddingActors", "false");
    }
    
    if (selectedActors.length > 0) {
        const actorPaths = selectedActors.map((actor) => actor.path).join(",");
        params.append("actors", actorPaths);
    }
    
    if (selectedTools.length > 0) {
        const toolMapping = {
            tool_apify_docs: "docs",
            tool_actor_runs: "runs",
            tool_apify_storage: "storage",
        };
        
        const mappedTools = selectedTools
            .map((toolId) => toolMapping[toolId])
            .filter((tool, index, arr) => tool && arr.indexOf(tool) === index);
        
        if (mappedTools.length > 0) {
            params.append("tools", mappedTools.join(","));
        }
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

function updateServerConfig() {
    elements.serverConfig.textContent = generateServerConfig();
    elements.serverUrl.textContent = generateMcpUrl();
}

// Utility functions
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary success message
        const button = element.parentNode.querySelector('.copy-btn');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Tab management
function switchTab(tabName) {
    activeTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
}

// Update authentication description
function updateAuthDescription() {
    const authDescription = document.getElementById('authDescription');
    if (authDescription) {
        if (useToken) {
            authDescription.textContent = 'Replace YOUR_APIFY_TOKEN with your actual Apify API token.';
        } else {
            authDescription.textContent = 'No token configuration needed - OAuth will be used automatically.';
        }
    }
}

// Search UI helpers
function showSearchLoading() {
    elements.actorsGrid.innerHTML = `
        <div class="search-loading">
            <div class="loading-spinner"></div>
            <p>Searching Apify Store...</p>
        </div>
    `;
}

function showSearchError(error) {
    elements.actorsGrid.innerHTML = `
        <div class="search-error">
            <p>Search failed: ${error}</p>
            <p class="text-sm text-muted-foreground">Please try again or check your connection.</p>
        </div>
    `;
}

function showEmptyState() {
    elements.actorsGrid.innerHTML = `
        <div class="empty-search-state">
            <p>No Actors found.</p>
            <p class="text-sm text-muted-foreground">Try searching for specific functionality like "web", "scraper", or "email".</p>
        </div>
    `;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);