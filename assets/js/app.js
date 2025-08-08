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
let modalSelection = [];
let filteredActors = [];
let searchResults = [];
let isUsingSearch = false;
let activeTab = "configuration";
let ratingCache = new Map(); // Cache for stable actor ratings

// DOM Elements - will be initialized after DOM is ready
let elements = {};

// Simple HTML escaper to prevent HTML injection in template strings
function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Ensure aria-labels on icon-only buttons
function ensureA11yAttributes() {
    try {
        document.querySelectorAll('button.copy-btn').forEach((btn) => {
            if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Copy');
        });
        document.querySelectorAll('button.modal-close').forEach((btn) => {
            if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Close');
        });
    } catch (_) {
        // no-op
    }
}

// Prism lazy loader with SRI
let prismLoadingPromise = null;
function loadScriptWithSRI(url, integrity) {
    return new Promise((resolve, reject) => {
        // If already present, resolve
        const existing = Array.from(document.scripts).find(s => s.src === url);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${url}`)));
            if (existing.complete || existing.readyState === 'complete') return resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        if (integrity) script.integrity = integrity;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.body.appendChild(script);
    });
}

function loadPrismIfNeeded() {
    if (window.Prism) return Promise.resolve();
    if (prismLoadingPromise) return prismLoadingPromise;
    const base = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0';
    const assets = [
        [`${base}/prism.min.js`, 'sha256-57iL3cbHV7L8jLET4kaYAasUp47BqPraTWOR41c/X58='],
        [`${base}/components/prism-python.min.js`, 'sha256-7UOFaFvPLUk1yNu6tL3hZgPaEyngktK/NsPa3WfpqFw='],
        [`${base}/components/prism-typescript.min.js`, 'sha256-hS9VE7ucqdskf4bs/OdKzJHFQXSdNJKRVyQFGP74FSo='],
        [`${base}/components/prism-javascript.min.js`, 'sha256-A0Xqg+Ere5dOlTx5pk3qNaQDCDCUSdtwuCAg+2iKwyE='],
        [`${base}/components/prism-json.min.js`, 'sha256-lW2GuqWufsQQZ1jzVKwtFAvc1/wQPezgL3PtErjWY+Q='],
        [`${base}/components/prism-bash.min.js`, 'sha256-YmCBQRDlGC8pVuO9JXQpVI2dvyqbZqY3GbJs+frJZqc='],
        [`${base}/plugins/toolbar/prism-toolbar.min.js`, 'sha256-NSwb7O0HrDJcC+2SASgGuCP8+tdpIhqnzLTZkGRJRCk='],
    ];
    prismLoadingPromise = assets.reduce(
        (p, [url, sri]) => p.then(() => loadScriptWithSRI(url, sri)),
        Promise.resolve()
    );
    return prismLoadingPromise;
}

function ensurePrismHighlight(container) {
    loadPrismIfNeeded().then(() => {
        setTimeout(() => {
            (container || document).querySelectorAll('pre code').forEach(block => {
                try { window.Prism && Prism.highlightElement(block); } catch (_) {}
            });
        }, 10);
    }).catch(() => {
        // ignore highlight errors
    });
}

// Initialize the app
function init() {
    if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
        console.log('App initializing...');
    }
    
    // Initialize DOM elements when DOM is ready
    elements = {
        selectedActors: document.getElementById('selectedActors'),
        toolsGrid: document.getElementById('toolsGrid'),
        serverUrl: document.getElementById('serverUrl'),
        serverConfig: document.getElementById('serverConfig'),
        actorModalOverlay: document.getElementById('actorModalOverlay'),
        actorsGrid: document.getElementById('actorsGrid'),
        actorSearch: document.getElementById('actorSearch'),
        enableDynamicActors: document.getElementById('enableDynamicActors')
    };
    
    if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
        console.log('Elements initialized:', elements);
        console.log('Modal element:', elements.actorModalOverlay);
    }

    // Force dark theme always
    document.documentElement.classList.add('dark');
    document.body && document.body.classList.add('dark');
    const appRoot = document.querySelector('.app');
    if (appRoot) appRoot.classList.add('dark');

    setupEventListeners();
    setupAccessibility();
    renderSelectedActors();
    renderToolsGrid();
    updateServerConfig();
    ensureA11yAttributes();
    updateIntegrationsPage(); // Initialize code examples with proper formatting
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

    // Removed theme toggle support: app runs in dark mode only
    
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            // Close actor modal if it's open
            if (elements.actorModalOverlay.classList.contains('active')) {
                window.closeActorModal();
            }
            // Close integration modal if it's open
            const integrationModal = document.getElementById('integrationModalOverlay');
            if (integrationModal && integrationModal.classList.contains('active')) {
                window.closeIntegrationModal();
            }
        }
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
    
    
    // Close modal when clicking overlay
    elements.actorModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.actorModalOverlay) {
            window.closeActorModal();
        }
    });

    // Also wire close button via JS to avoid relying on inline handlers
    const actorCloseBtn = elements.actorModalOverlay.querySelector('.modal-close');
    if (actorCloseBtn) {
        actorCloseBtn.addEventListener('click', window.closeActorModal);
    }

    // Integration modal overlay and close button
    const integrationOverlay = document.getElementById('integrationModalOverlay');
    if (integrationOverlay) {
        integrationOverlay.addEventListener('click', (e) => {
            if (e.target === integrationOverlay) {
                window.closeIntegrationModal();
            }
        });
        const integrationCloseBtn = integrationOverlay.querySelector('.modal-close');
        if (integrationCloseBtn) {
            integrationCloseBtn.addEventListener('click', window.closeIntegrationModal);
        }
    }

    // Keyboard support for integration cards
    document.querySelectorAll('.integration-card').forEach(card => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const integration = card.getAttribute('data-integration');
                if (integration) window.showIntegrationDetails(integration);
            }
        });
    });
}

// Accessibility setup for tabs and modals
function setupAccessibility() {
    // Tabs ARIA roles and keyboard navigation
    const tabsContainer = document.getElementById('tabsContainer');
    if (tabsContainer) {
        tabsContainer.setAttribute('role', 'tablist');
        const tabButtons = document.querySelectorAll('.tab-button');
        document.querySelectorAll('.tab-content').forEach(panel => panel.setAttribute('role', 'tabpanel'));

        tabButtons.forEach((btn) => {
            const tabName = btn.dataset.tab;
            const panel = document.getElementById(tabName);
            const selected = btn.classList.contains('active');

            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-controls', tabName);
            btn.setAttribute('aria-selected', selected ? 'true' : 'false');
            btn.setAttribute('tabindex', selected ? '0' : '-1');

            if (panel) {
                if (!btn.id) btn.id = `tab-${tabName}`;
                panel.setAttribute('aria-labelledby', btn.id);
            }
        });

        tabsContainer.addEventListener('keydown', (e) => {
            const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
            if (!keys.includes(e.key)) return;
            e.preventDefault();
            const tabs = Array.from(document.querySelectorAll('.tab-button'));
            let currentIndex = tabs.findIndex(t => t === document.activeElement);
            if (currentIndex === -1) currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
            let nextIndex = currentIndex;
            if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
            if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            if (e.key === 'Home') nextIndex = 0;
            if (e.key === 'End') nextIndex = tabs.length - 1;
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
        });
    }

    // Modal ARIA attributes
    const actorOverlay = document.getElementById('actorModalOverlay');
    if (actorOverlay) {
        const modal = actorOverlay.querySelector('.modal');
        const title = actorOverlay.querySelector('.modal-header h3');
        if (modal) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            if (title) {
                if (!title.id) title.id = 'actorModalTitle';
                modal.setAttribute('aria-labelledby', title.id);
            }
        }
    }

    const integrationOverlay = document.getElementById('integrationModalOverlay');
    if (integrationOverlay) {
        const modal = integrationOverlay.querySelector('.modal');
        if (modal) {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'integrationTitle');
        }
    }
}

let lastFocusedElement = null;
function trapFocus(modalEl) {
    lastFocusedElement = document.activeElement;
    const focusableSelectors = [
        'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
        'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed',
        '[contenteditable]', '[tabindex]:not([tabindex="-1"])'
    ];
    const focusable = Array.from(modalEl.querySelectorAll(focusableSelectors.join(',')))
        .filter(el => el.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function onKeydown(e) {
        if (e.key !== 'Tab') return;
        if (focusable.length === 0) return;
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
    modalEl.__trapHandler = onKeydown;
    document.addEventListener('keydown', onKeydown);
    if (first) first.focus();
}

function releaseFocus(modalEl) {
    if (modalEl && modalEl.__trapHandler) {
        document.removeEventListener('keydown', modalEl.__trapHandler);
        delete modalEl.__trapHandler;
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
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
            <button class="btn btn-ghost btn-icon remove-actor-btn" onclick="removeActor('${escapeHTML(actor.id)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                <span class="sr-only">Remove Actor</span>
            </button>
            <div class="selected-actor-content">
                <img src="${actor.icon || 'assets/images/placeholder-user.jpg'}" alt="${escapeHTML(actor.title)}" class="selected-actor-icon" loading="lazy" width="40" height="40" onerror="this.onerror=null;this.src='assets/images/placeholder-user.jpg'">
                <div class="selected-actor-info">
                    <p class="selected-actor-title">${escapeHTML(actor.title)}</p>
                    <p class="selected-actor-path">${escapeHTML(actor.path)}</p>
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
        toolItem.onclick = () => window.toggleTool(tool.id);
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
    if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
        console.log('renderActorsGrid called');
        console.log('isUsingSearch:', isUsingSearch);
        console.log('searchResults:', searchResults);
        console.log('filteredActors:', filteredActors);
    }
    
    elements.actorsGrid.innerHTML = '';
    
    const actorsToRender = isUsingSearch ? searchResults : filteredActors;
    if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
        console.log('actorsToRender:', actorsToRender.length, 'items');
    }
    
    if (actorsToRender.length === 0) {
        if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
            console.log('Showing empty state');
        }
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
        const rating = getStableRating(actor);
        const userCount = actor.stats?.totalUsers || Math.floor(Math.random() * 200000);
        const description = actor.description || actor.title;

        // Debug logging - show complete actor object structure
        if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
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
        }

        const iconHtml = actor.pictureUrl || actor.icon ? 
            `<img src="${actor.pictureUrl || actor.icon}" alt="${escapeHTML(actor.title)}" class="actor-icon" loading="lazy" width="40" height="40" onerror="this.onerror=null;this.src='assets/images/placeholder-user.jpg'">` :
            `<img src="assets/images/placeholder-user.jpg" alt="${escapeHTML(actor.title)}" class="actor-icon" loading="lazy" width="40" height="40">`;

        actorCard.innerHTML = `
            <div class="actor-card-header">
                <div class="actor-card-icon">
                    ${iconHtml}
                </div>
                <div class="actor-card-title-section">
                    <h4 class="actor-card-title">${escapeHTML(actor.title)}</h4>
                    <p class="actor-card-path">${escapeHTML(actor.path)}</p>
                </div>
            </div>
            <div class="actor-card-description">
                <p>${escapeHTML(description)}</p>
            </div>
            <div class="actor-card-footer">
                <div class="actor-card-company">
                    <img src="${companyLogo}" alt="${escapeHTML(companyName)}" class="company-logo" loading="lazy" width="24" height="24" onerror="this.onerror=null;this.src='assets/images/placeholder-user.jpg'">
                    <span class="company-name">${escapeHTML(companyName)}</span>
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
    const modalBox = elements.actorModalOverlay.querySelector('.modal');
    if (modalBox) trapFocus(modalBox);
    
    // Load first page of popular actors and enable infinite scroll
    showSearchLoading();
    try {
        window.__actorsScroll = { offset: 0, limit: 20, total: null, loading: false };
        const { limit } = window.__actorsScroll;
        const results = await window.apifySearch.getPopularActorsPage(limit, 0);
        if (typeof window !== 'undefined' && window.__DEBUG__ !== false) {
            console.log('Modal got results:', results);
        }
        if (results.items && results.items.length > 0) {
            searchResults = results.items;
            isUsingSearch = true;
            window.__actorsScroll.total = results.total ?? results.items.length;
            window.__actorsScroll.offset = results.offset + results.count;
            renderActorsGrid();
            attachInfiniteScroll();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Modal error:', error);
        showSearchError('Failed to load actors');
    }
}

window.closeActorModal = function() {
    // Direct approach - always get fresh reference
    const modal = document.getElementById('actorModalOverlay');
    if (modal) {
        modal.classList.remove('active');
    }
    const modalBox = modal ? modal.querySelector('.modal') : null;
    if (modalBox) releaseFocus(modalBox);
    
    // Clear search
    const searchInput = document.getElementById('actorSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Clear state
    filteredActors = [];
    searchResults = [];
    isUsingSearch = false;
    // detach infinite scroll listener
    if (modal && modal.__onInfiniteScroll) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) modalBody.removeEventListener('scroll', modal.__onInfiniteScroll);
        delete modal.__onInfiniteScroll;
    }
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

function attachInfiniteScroll() {
    const grid = elements.actorsGrid;
    const overlay = elements.actorModalOverlay;
    if (!grid || !overlay) return;

    function onScroll(e) {
        const container = e.target.closest('.modal .modal-body') || e.target;
        if (!container || window.__actorsScroll?.loading) return;
        const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        const state = window.__actorsScroll;
        if (!state || state.total !== null && state.offset >= state.total) return;
        if (!nearBottom) return;
        // Load next page
        state.loading = true;
        window.apifySearch.getPopularActorsPage(state.limit, state.offset).then(results => {
            const newItems = results.items || [];
            if (newItems.length > 0) {
                searchResults = searchResults.concat(newItems);
                renderActorsGrid();
                state.total = results.total ?? state.total;
                state.offset = results.offset + results.count;
            }
        }).catch(() => {
            // ignore
        }).finally(() => {
            state.loading = false;
        });
    }

    // Attach to modal body for scrolling
    const modalBody = overlay.querySelector('.modal-body');
    if (modalBody) {
        modalBody.addEventListener('scroll', onScroll);
        overlay.__onInfiniteScroll = onScroll;
    }
}

window.saveActorSelection = function() {
    try {
        // Update the selected actors
        selectedActors = [...modalSelection];
        renderSelectedActors();
        updateServerConfig();
        
        // Close the modal - direct approach
        const modal = document.getElementById('actorModalOverlay');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Clear search
        const searchInput = document.getElementById('actorSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Clear state
        filteredActors = [];
        searchResults = [];
        isUsingSearch = false;
    } catch (error) {
        console.error('Error in saveActorSelection:', error);
        // Still try to close the modal even if there's an error
        const modal = document.getElementById('actorModalOverlay');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

window.removeActor = function(actorId) {
    selectedActors = selectedActors.filter(a => a.id !== actorId);
    renderSelectedActors();
    updateServerConfig();
}


// Tool management
window.toggleTool = function(toolId) {
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
                args: args
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
    // Update server config with copy button (only if container exists)
    if (elements.serverConfig) {
        elements.serverConfig.innerHTML = `${generateServerConfig()}<button class="copy-btn-inline" onclick="copyToClipboard('serverConfig')" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
        </button>`;
    }
    
    // Update server URL with copy button (only if container exists)
    if (elements.serverUrl) {
        elements.serverUrl.innerHTML = `${generateMcpUrl()}<button class="copy-btn-inline" onclick="copyToClipboard('serverUrl')" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
        </button>`;
    }
}

// Utility functions
function getStableRating(actor) {
    // Check if we already have a cached rating for this actor
    if (ratingCache.has(actor.id)) {
        return ratingCache.get(actor.id);
    }
    
    // If actor has real rating data, use it
    if (actor.stats?.avgRating) {
        const rating = actor.stats.avgRating;
        ratingCache.set(actor.id, rating);
        return rating;
    }
    
    // Generate deterministic fallback rating based on actor ID
    // This ensures the same actor always gets the same rating
    let hash = 0;
    for (let i = 0; i < actor.id.length; i++) {
        const char = actor.id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to a rating between 4.0 and 5.0
    const normalizedHash = Math.abs(hash) / Math.pow(2, 31);
    const rating = 4.0 + normalizedHash;
    
    // Cache and return the stable rating
    ratingCache.set(actor.id, rating);
    return rating;
}

// This function is now defined as window.copyToClipboard below

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
            <p>Search failed: ${escapeHTML(error)}</p>
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

// Debug function to test modal closing
window.debugCloseModal = function() {
    console.log('=== DEBUG CLOSE MODAL ===');
    const modal = document.getElementById('actorModalOverlay');
    console.log('Modal element:', modal);
    console.log('Current classes:', modal ? modal.className : 'null');
    console.log('Current display:', modal ? window.getComputedStyle(modal).display : 'null');
    
    if (modal) {
        modal.classList.remove('active');
        console.log('After removing active:');
        console.log('Classes:', modal.className);
        console.log('Display:', window.getComputedStyle(modal).display);
    }
    console.log('=== END DEBUG ===');
}

// Integrations page functions
window.copyToClipboard = function(elementId, button) {
    const element = document.getElementById(elementId);
    
    // Handle both inline copy buttons and regular copy buttons
    let text = '';
    let targetButton = button || element.querySelector('.copy-btn-inline');
    
    if (elementId === 'serverConfig') {
        text = generateServerConfig();
    } else if (elementId === 'serverUrl') {
        text = generateMcpUrl();
    } else {
        text = element.textContent;
    }
    
    const writeClipboard = () => navigator.clipboard.writeText(text);

    const onSuccess = () => {
        if (targetButton) {
            const originalContent = targetButton.innerHTML;
            const isInlineButton = targetButton.classList.contains('copy-btn-inline');
            
            if (isInlineButton) {
                targetButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                `;
                targetButton.style.color = 'var(--success)';
            } else {
                targetButton.classList.add('copied');
                targetButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                `;
            }
            
            setTimeout(() => {
                if (isInlineButton) {
                    targetButton.style.color = '';
                } else {
                    targetButton.classList.remove('copied');
                }
                targetButton.innerHTML = originalContent;
            }, 2000);
        }
    };

    const onFailure = (err) => {
        try {
            // Fallback for insecure contexts: use a hidden textarea + execCommand
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            const selection = document.getSelection();
            const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (selected && selection) {
                selection.removeAllRanges();
                selection.addRange(selected);
            }
            if (ok) return onSuccess();
        } catch (fallbackErr) {
            console.error('Copy fallback failed: ', fallbackErr);
        }
        console.error('Failed to copy: ', err);
    };

    // Try modern API first, then fallback
    writeClipboard().then(onSuccess).catch(onFailure);
}

window.copyCode = function(button) {
    const codeBlock = button.parentElement.querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.classList.add('copied');
        button.textContent = 'Copied!';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = originalText;
        }, 2000);
    });
}

window.switchPlatformTab = function(platform) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.platform-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.platform-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Add active class to selected tab and panel
    document.querySelector(`.platform-tab[data-platform="${platform}"]`).classList.add('active');
    document.querySelector(`.platform-panel[data-platform-panel="${platform}"]`).classList.add('active');
}

window.showIntegrationDetails = function(integration) {
    const modal = document.getElementById('integrationModalOverlay');
    const title = document.getElementById('integrationTitle');
    const content = document.getElementById('integrationContent');
    
    // Header metadata (logo + name) for each integration
    const integrationHeaderMeta = {
        'claude': { name: 'Claude', icon: 'assets/images/claude.png' },
        'claude-code': { name: 'Claude Code', icon: 'assets/images/anthropic.png' },
        'cursor': { name: 'Cursor', icon: 'assets/images/cursor.png' },
        'vscode': { name: 'VS Code', icon: 'assets/images/vscode.png' },
        'windsurf': { name: 'Windsurf', icon: 'assets/images/windsurf.png' },
        'warp': { name: 'Warp', icon: 'assets/images/warp.jpg' },
        'anthropic-api': { name: 'Anthropic API', icon: 'assets/images/anthropic.png' },
        'openai-api': { name: 'OpenAI API', icon: 'assets/images/openai.png' },
        'python-sdk': { name: 'Python', icon: 'assets/images/python.png' },
        'typescript-sdk': { name: 'TypeScript', icon: 'assets/images/typescript.png' },
        'json-config': { name: 'JSON Config', icon: 'assets/images/json.png' }
    };

    // Integration details content
    const integrationDetails = {
        'claude': {
            title: 'Connect to Claude',
            content: `
                <div class="integration-step">
                    <p>Connect Claude to Apify MCP, enabling it to perform real-world tasks through a simple, secure connection without leaving your conversation.</p>
                </div>
                
                <div class="integration-step">
                    <h4>For Claude account admins/owners</h4>
                    <ol>
                        <li>Go to <a href="https://claude.ai/settings/connectors" target="_blank">claude.ai/settings/connectors</a></li>
                        <li>Click the "Browse connectors" button</li>
                        <li>Find the Apify connector and click on it</li>
                        <li>Click the "Add to your team" button</li>
                        <li>Paste in your Integration URL from below</li>
                        <li>Click "Add"</li>
                    </ol>
                </div>
                
                <div class="integration-step">
                    <h4>Integration URL</h4>
                    <div class="code-block">
                        <pre><code id="claudeUrl" class="language-bash">${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Note:</strong> The added integration will be available to all users in the Claude organization, but only you will be able to see actions you add to this MCP server.</p>
                </div>
                
                <div class="integration-step">
                    <h4>For Claude account members</h4>
                    <p>Once your Claude account admin/owner has completed the steps above:</p>
                    <ol>
                        <li>Go to <a href="https://claude.ai/settings/connectors" target="_blank">claude.ai/settings/connectors</a></li>
                        <li>You should see the Apify integration that your admin added and named</li>
                        <li>Next to that integration, click "Connect" - you'll be taken to an OAuth screen</li>
                        <li>Once you've authorized the connection, you can use your Apify MCP tools in Claude</li>
                        <li>View, enable, and disable Claude's access to tools with the "Search and Tools" button in chat</li>
                    </ol>
                </div>
            `
        },
        'claude-code': {
            title: 'Connect to Claude Code',
            content: `
                <div class="integration-step">
                    <p>Use Apify MCP directly from Claude Code with a simple command-line setup. Enable your AI assistant to perform real-world tasks through a secure connection without leaving your development environment.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Installing Claude Code</h4>
                    <p>First, <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank">set up Claude Code if you haven't already</a></p>
                </div>
                
                <div class="integration-step">
                    <h4>Configuring Apify MCP in Claude Code</h4>
                    <ol>
                        <li>Open your terminal</li>
                        <li>Run the following command to add this Apify MCP server:</li>
                    </ol>
                    <div class="code-block">
                        <pre><code class="language-bash">claude mcp add apify ${document.getElementById('mcpServerUrl').textContent} -t http -H "Authorization: Bearer YOUR_API_KEY"</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>API Key</h4>
                    <p>The API key for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>YOUR_API_KEY_HERE</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Using MCP tools in Claude Code</h4>
                    <ol>
                        <li>Start a new conversation with Claude Code</li>
                        <li>Claude will automatically have access to your Apify MCP tools</li>
                        <li>Ask Claude to use them to automate your workflows!</li>
                    </ol>
                </div>
            `
        },
        'cursor': {
            title: 'Connect to Cursor',
            content: `
                <div class="integration-step">
                    <p>Use tools directly from Cursor IDE with Apify MCP. Enable your AI assistant to perform real-world tasks through a simple, secure connection without leaving your coding environment.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Configuring Apify MCP in Cursor</h4>
                    <p>First try and click on the "Add to Cursor" button below to automatically have it configured. If that doesn't work or you need to modify the installation follow the directions below.</p>
                    
                    <button class="btn-secondary" style="margin: 1rem 0;">Add to Cursor</button>
                    
                    <ol>
                        <li>Open Cursor settings (⌘+⌘+J)</li>
                        <li>Navigate to the "MCP Tools" tab and click "New MCP Server"</li>
                        <li>Copy/paste the following JSON configuration from below, then hit CMD+S or CTRL+S to save.</li>
                    </ol>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Caution:</strong> Treat your MCP server URL like a password! It can be used to run tools attached to this server and access your data.</p>
                </div>
                
                <div class="code-block">
                    <pre><code class="language-json">{
  "mcpServers": {
    "Apify": {
      "url": "${document.getElementById('mcpServerUrl').textContent}"
    }
  }
}</code></pre>
                    <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
                
                <div class="integration-step">
                    <h4>Server URL</h4>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <p style="margin-top: 1rem;">To use Apify MCP within Cursor, set the chat to Agent mode</p>
            `
        },
        'vscode': {
            title: 'Connect to Visual Studio Code',
            content: `
                <div class="integration-step">
                    <p>Use tools directly inside of Visual Studio Code with Apify MCP. Enable your AI assistant to perform real-world tasks through a simple, secure connection without leaving your coding environment.</p>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Important:</strong> You must have GitHub Copilot enabled and set to 'Agent' mode in Visual Studio Code for Apify MCP to work properly.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Configuring Apify MCP in Visual Studio Code</h4>
                    <ol>
                        <li>Open the Visual Studio Code command palette (⌘+⌘+P on Mac, Ctrl+Shift+P on Windows)</li>
                        <li>Type "MCP: Add Server..." and press Enter</li>
                        <li>Choose "HTTP (HTTP or Server-Sent Events)" and press Enter</li>
                        <li>Paste the server URL from below into the "Server URL" field and press Enter</li>
                        <li>Give the server a name and press Enter</li>
                        <li>Make sure that GitHub Copilot is set to "Agent" mode</li>
                        <li>Ask GitHub Copilot to use the tools from your server!</li>
                    </ol>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Caution:</strong> Treat your MCP server URL like a password! It can be used to run tools attached to this server and access your data.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Server URL</h4>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `
        },
        'windsurf': {
            title: 'Connect to Windsurf',
            content: `
                <div class="integration-step">
                    <p>Use Apify MCP directly from Windsurf IDE with Apify MCP. Enable your AI assistant to perform real-world tasks through a simple, secure connection without leaving your coding environment.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Configuring Apify MCP in Windsurf</h4>
                    <ol>
                        <li>Open Windsurf settings (⌘+,)</li>
                        <li>Navigate to the "Cascade" tab and click "Add Server"</li>
                        <li>Select "Add custom server +"</li>
                        <li>Add the following JSON configuration, replacing the placeholder URL with your MCP URL from below</li>
                    </ol>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Caution:</strong> Treat your MCP server URL like a password! It can be used to run tools attached to this server and access your data.</p>
                </div>
                
                <div class="code-block">
                    <pre><code class="language-json">{
  "mcpServers": {
    "Apify": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${document.getElementById('mcpServerUrl').textContent}",
        "--transport",
        "http-only"
      ],
      "working_directory": null,
      "start_on_launch": true
    }
  }
}</code></pre>
                    <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
                
                <div class="integration-step">
                    <h4>Server URL</h4>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `
        },
        'warp': {
            title: 'Connect to Warp',
            content: `
                <div class="integration-step">
                    <p>Use Apify MCP with Warp. Enable your AI assistant to perform real-world tasks through a simple, secure connection without leaving your coding environment.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Configuring Apify MCP in Warp</h4>
                    <ol>
                        <li>Open Warp's MCP Server settings</li>
                        <li>Click "Add Server"</li>
                        <li>Add the following JSON configuration, replacing the placeholder URL with your MCP URL from below</li>
                        <li>Save and click 'Start'</li>
                    </ol>
                </div>
                
                <div class="warning-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p><strong>Caution:</strong> Treat your MCP server URL like a password! It can be used to run tools attached to this server and access your data.</p>
                </div>
                
                <div class="code-block">
                    <pre><code class="language-json">{
  "mcpServers": {
    "Apify": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${document.getElementById('mcpServerUrl').textContent}",
        "--transport",
        "http-only"
      ],
      "working_directory": null,
      "start_on_launch": true
    }
  }
}</code></pre>
                    <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                </div>
                
                <div class="integration-step">
                    <h4>Server URL</h4>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `
        },
        'anthropic-api': {
            title: 'Connect to Anthropic API',
            content: `
                <div class="integration-step">
                    <p>Connect Anthropic's Messages API to your Apify MCP server</p>
                </div>
                
                <div class="integration-step">
                    <h4>Get an Anthropic API Key</h4>
                    <p>First, make sure that you have a valid Anthropic API key.</p>
                    <p>To view or generate a new Anthropic API Key, go to the <a href="https://console.anthropic.com/api" target="_blank">Anthropic developer console API Keys page</a></p>
                    <p>Export your API key as an environment variable:</p>
                    <div class="code-block">
                        <pre><code class="language-bash">export ANTHROPIC_API_KEY="sk-..."</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>MCP server information</h4>
                    <p><strong>MCP Server URL</strong></p>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    
                    <p style="margin-top: 1rem;"><strong>API Key</strong></p>
                    <p>The API key for this MCP server.</p>
                    <p>Pass this in a Authorization: Bearer {apiKey} header when calling the Apify MCP server.</p>
                    <div class="code-block">
                        <pre><code>YOUR_API_KEY_HERE</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Using Anthropic's Messages API</h4>
                    <p><a href="https://docs.anthropic.com/claude/docs/messages-api" target="_blank">Anthropic's Messages API</a> can be used to call Apify MCP from anywhere.</p>
                    
                    <h4>Code Example</h4>
                    <div class="code-block">
                        <pre><code class="language-bash">curl https://api.anthropic.com/v1/messages \\
-H "Content-Type: application/json" \\
-H "X-API-Key: $ANTHROPIC_API_KEY" \\
-H "anthropic-version: 2023-06-01" \\
-H "anthropic-beta: mcp-client-2025-04-04" \\
-d '{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "messages": [{"role": "user", "content": "What tools do you have available?"}],
  "mcp_servers": [
    {
      "type": "url",
      "url": "${document.getElementById('mcpServerUrl').textContent}",
      "name": "apify",
      "authorization_token": "YOUR_API_KEY"
    }
  ]
}'</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    </div>
                </div>
            `
        },
        'openai-api': {
            title: 'Connect to OpenAI API',
            content: `
                <div class="integration-step">
                    <p>Connect OpenAI's Responses API to your Apify MCP server</p>
                </div>
                
                <div class="integration-step">
                    <h4>Get an OpenAI API Key</h4>
                    <p>First, make sure that you have a valid OpenAI API key.</p>
                    <p>To view or generate a new OpenAI API Key, go to the <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI platform API Keys page</a></p>
                    <p>Export your API key as an environment variable:</p>
                    <div class="code-block">
                        <pre><code class="language-bash">export OPENAI_API_KEY="sk-..."</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>MCP server information</h4>
                    <p><strong>MCP Server URL</strong></p>
                    <p>The URL for this MCP server.</p>
                    <div class="code-block">
                        <pre><code>${document.getElementById('mcpServerUrl').textContent}</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    
                    <p style="margin-top: 1rem;"><strong>API Key</strong></p>
                    <p>The API key for this MCP server.</p>
                    <p>Pass this in a Authorization: Bearer {apiKey} header when calling the Apify MCP server.</p>
                    <div class="code-block">
                        <pre><code>YOUR_API_KEY_HERE</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Using OpenAI's Responses API</h4>
                    <p><a href="https://platform.openai.com/docs/api-reference/responses" target="_blank">OpenAI's Responses API</a> can be used to call Apify MCP from anywhere.</p>
                    
                    <h4>Code Example</h4>
                    <div class="code-block">
                        <pre><code class="language-bash">curl --location 'https://api.openai.com/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $OPENAI_API_KEY" \\
--data '{
  "model": "gpt-4.1",
  "tools": [
    {
      "type": "mcp",
      "server_label": "apify",
      "server_url": "${document.getElementById('mcpServerUrl').textContent}",
      "require_approval": "never",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  ],
  "input": "List all of my available tools",
  "tool_choice": "required"
}'</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    </button>
                    </div>
                </div>
            `
        },
        'python-sdk': {
            title: 'Python SDK',
            content: `
                <div class="integration-step">
                    <p>Integrate Apify MCP into your Python applications using the official MCP SDK.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Installation</h4>
                    <div class="code-block">
                        <pre><code class="language-bash">pip install "mcp[cli]"</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Example Usage</h4>
                    <div class="code-block">
                        <pre><code class="language-python">import mcp
from mcp.client.streamable_http import streamablehttp_client

async def main():
    url = "${document.getElementById('mcpServerUrl').textContent}"
    async with streamablehttp_client(url) as (read_stream, write_stream):
        async with mcp.ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools_result = await session.list_tools()
            print("Available tools:", [t.name for t in tools_result.tools])</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Authentication</h4>
                    <p>Pass your API key in the Authorization header when connecting to the MCP server:</p>
                    <div class="code-block">
                        <pre><code class="language-python">headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
# Pass headers to your HTTP client configuration</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `
        },
        'typescript-sdk': {
            title: 'TypeScript SDK',
            content: `
                <div class="integration-step">
                    <p>Integrate Apify MCP into your TypeScript/JavaScript applications using the official MCP SDK.</p>
                </div>
                
                <div class="integration-step">
                    <h4>Installation</h4>
                    <div class="code-block">
                        <pre><code class="language-bash">npm install @modelcontextprotocol/sdk</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Example Usage</h4>
                    <div class="code-block">
                        <pre><code class="language-typescript">import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk";

const serverUrl = "${document.getElementById('mcpServerUrl').textContent}";
const transport = new StreamableHTTPClientTransport(serverUrl, {
    headers: {
        "Authorization": "Bearer YOUR_API_KEY"
    }
});

const client = new Client({
    name: "My App",
    version: "1.0.0"
});

await client.connect(transport);
const tools = await client.listTools();
console.log("Available tools:", tools.map(t => t.name));</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Authentication</h4>
                    <p>Include your API key in the Authorization header when creating the transport:</p>
                    <div class="code-block">
                        <pre><code class="language-typescript">const transport = new StreamableHTTPClientTransport(serverUrl, {
    headers: {
        "Authorization": "Bearer YOUR_API_KEY"
    }
});</code></pre>
                        <button class="copy-code-btn" onclick="copyCode(this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `
        },
        'json-config': {
            title: 'JSON Configuration',
            content: `
                <div class="integration-step">
                    <p>Use JSON configuration to integrate Apify MCP with various MCP-compatible clients and tools.</p>
                </div>
                
                <div class="platform-tabs">
                    <button class="platform-tab active" data-platform="mac" onclick="switchPlatformTab('mac')">Mac/Linux</button>
                    <button class="platform-tab" data-platform="windows" onclick="switchPlatformTab('windows')">Windows</button>
                    <button class="platform-tab" data-platform="wsl" onclick="switchPlatformTab('wsl')">WSL</button>
                </div>
                
                <div class="platform-content">
                    <!-- Mac/Linux Config -->
                    <div class="platform-panel active" data-platform-panel="mac">
                        <h4>JSON Configuration for Mac/Linux</h4>
                        <div class="code-block">
                            <pre><code class="language-json">{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": [
        "-y",
        "@apify/mcp-server",
        "run",
        "@apify/mcp-server",
        "--profile",
        "default"
      ]
    }
  }
}</code></pre>
                            <button class="copy-code-btn" onclick="copyCode(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Windows Config -->
                    <div class="platform-panel" data-platform-panel="windows">
                        <h4>JSON Configuration for Windows</h4>
                        <div class="code-block">
                            <pre><code class="language-json">{
  "mcpServers": {
    "apify": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@apify/mcp-server",
        "run",
        "@apify/mcp-server",
        "--profile",
        "default"
      ]
    }
  }
}</code></pre>
                            <button class="copy-code-btn" onclick="copyCode(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- WSL Config -->
                    <div class="platform-panel" data-platform-panel="wsl">
                        <h4>JSON Configuration for WSL</h4>
                        <div class="code-block">
                            <pre><code class="language-json">{
  "mcpServers": {
    "apify": {
      "command": "wsl",
      "args": [
        "npx",
        "-y",
        "@apify/mcp-server",
        "run",
        "@apify/mcp-server",
        "--profile",
        "default"
      ]
    }
  }
}</code></pre>
                            <button class="copy-code-btn" onclick="copyCode(this)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="integration-step">
                    <h4>Using with MCP Clients</h4>
                    <p>This JSON configuration can be used with any MCP-compatible client. Simply copy the configuration above and paste it into your client's MCP settings.</p>
                    <p>Common MCP clients include:</p>
                    <ul style="margin-left: 1.5rem; list-style: disc;">
                        <li>Claude Desktop</li>
                        <li>Cursor IDE</li>
                        <li>VS Code with MCP extension</li>
                        <li>Other MCP-compatible tools</li>
                    </ul>
                </div>
            `
        }
    };
    
    const details = integrationDetails[integration];
    if (details) {
        const meta = integrationHeaderMeta[integration];
        if (meta) {
            title.innerHTML = `<span class="integration-modal-title"><img src="${meta.icon}" alt="${meta.name}" class="integration-modal-title-icon" width="24" height="24" /><span>${meta.name}</span></span>`;
        } else {
            title.textContent = details.title;
        }
        content.innerHTML = details.content;
        modal.classList.add('active');
        const modalBox = modal.querySelector('.modal');
        if (modalBox) trapFocus(modalBox);
        
        // Apply Prism highlighting to all code blocks in the modal (lazy-load Prism if needed)
        ensurePrismHighlight(content);
    }
}

window.closeIntegrationModal = function() {
    const modal = document.getElementById('integrationModalOverlay');
    modal.classList.remove('active');
    const modalBox = modal.querySelector('.modal');
    if (modalBox) releaseFocus(modalBox);
}

// Update the MCP server URL dynamically
function updateIntegrationsPage() {
    const urlElement = document.getElementById('mcpServerUrl');
    if (urlElement) {
        urlElement.textContent = generateMcpUrl();
    }
    
    // Update SDK examples with actual URL
    const pythonExample = document.getElementById('pythonExample');
    if (pythonExample) {
        pythonExample.textContent = `import mcp
from mcp.client.streamable_http import streamablehttp_client

async def main():
    url = "${generateMcpUrl()}"
    async with streamablehttp_client(url) as (read_stream, write_stream):
        async with mcp.ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            tools_result = await session.list_tools()
            print("Available tools:", [t.name for t in tools_result.tools])`.trim();
        // Re-highlight with Prism (lazy)
        ensurePrismHighlight(pythonExample.parentElement);
    }
    
    const typescriptExample = document.getElementById('typescriptExample');
    if (typescriptExample) {
        typescriptExample.textContent = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk";

const serverUrl = "${generateMcpUrl()}";
const transport = new StreamableHTTPClientTransport(serverUrl);

const client = new Client({
    name: "My App",
    version: "1.0.0"
});

await client.connect(transport);
const tools = await client.listTools();
console.log("Available tools:", tools.map(t => t.name));`.trim();
        // Re-highlight with Prism (lazy)
        ensurePrismHighlight(typescriptExample.parentElement);
    }
}

// Call updateIntegrationsPage when switching to Integrations tab
const originalSwitchTab = window.switchTab;
window.switchTab = function(tabName) {
    originalSwitchTab(tabName);
    if (tabName === 'integrations') {
        updateIntegrationsPage();
    }
};