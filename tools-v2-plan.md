# Tools Configuration v2 Migration Plan

## Overview

This document outlines the detailed plan for migrating the Apify MCP Dashboard from the current tools configuration (v1) to the new proposed tools configuration (v2) as specified in `tools-configuration-v2.md`.

## Current Implementation Analysis

### Current Tools Structure (v1)

The current implementation uses a simplified tools structure in `assets/js/app.js`:

```javascript
const TOOLS_DATA = [
    {
        id: 'tool_actor_discovery',
        name: 'Actor discovery and management',
        description: '...',
        category: 'default'  // Always enabled, not reflected in URL
    },
    {
        id: 'tool_apify_docs', 
        name: 'Apify documentation',
        description: '...',
        category: 'default'  // Always enabled, not reflected in URL
    },
    {
        id: 'tool_actor_runs',
        name: 'Actor runs', 
        description: '...',
        category: 'optional'  // Maps to "runs" in URL
    },
    {
        id: 'tool_apify_storage',
        name: 'Apify storage',
        description: '...',
        category: 'optional'  // Maps to "storage" in URL
    }
];
```

### Current URL Generation Issues

The current `generateMcpUrl()` function has several issues:

1. **Legacy parameter**: Uses `enableAddingActors=false` instead of new `tools=add-actor`
2. **Missing default tools**: Default tools (`tool_actor_discovery`, `tool_apify_docs`) are not included in URL
3. **Incomplete tool mapping**: Only maps `runs` and `storage`, missing many v2 tools
4. **No individual tool support**: Cannot select individual tools within categories
5. **Missing default actor**: No support for `apify/rag-web-browser` default actor

### Current Tool Selection Logic

- `selectedTools` defaults to `['tool_actor_discovery']`
- Only optional tools are mapped to URL parameters
- Default tools are assumed to always be available

## Required Changes for v2

### 1. Update Tools Data Structure

**File:** `assets/js/app.js`

Replace `TOOLS_DATA` array with new v2 structure:

```javascript
const TOOLS_DATA = {
    categories: [
        {
            id: 'actors',
            name: 'Actor Management', 
            description: 'Search, discover, and call Apify Actors',
            defaultEnabled: true,
            tools: [
                {
                    id: 'search-actors',
                    name: 'Search Actors',
                    description: 'Search for Actors in the Apify Store'
                },
                {
                    id: 'fetch-actor-details', 
                    name: 'Actor Details',
                    description: 'Retrieve detailed information about a specific Actor'
                },
                {
                    id: 'call-actor',
                    name: 'Call Actor',
                    description: 'Generic tool to call any Actor by ID and input'
                }
            ]
        },
        {
            id: 'docs',
            name: 'Documentation',
            description: 'Search and access Apify documentation',
            defaultEnabled: true,
            tools: [
                {
                    id: 'search-apify-docs',
                    name: 'Search Documentation', 
                    description: 'Search the Apify documentation'
                },
                {
                    id: 'fetch-apify-docs',
                    name: 'Fetch Documentation',
                    description: 'Fetch the full content of a documentation page'
                }
            ]
        },
        {
            id: 'experimental',
            name: 'Experimental Features',
            description: 'Beta features for advanced users',
            defaultEnabled: false,
            tools: [
                {
                    id: 'add-actor',
                    name: 'Dynamic Actor Addition',
                    description: 'Add an Actor as a new tool for the session'
                }
            ]
        },
        {
            id: 'runs',
            name: 'Actor Runs',
            description: 'Monitor and manage Actor executions',
            defaultEnabled: false,
            tools: [
                {
                    id: 'get-actor-run',
                    name: 'Get Actor Run',
                    description: 'Get detailed information about a specific Actor run'
                },
                {
                    id: 'get-actor-run-list',
                    name: 'List Actor Runs', 
                    description: 'Get a list of an Actor\'s runs, filterable by status'
                },
                {
                    id: 'get-actor-log',
                    name: 'Get Run Logs',
                    description: 'Retrieve the logs for a specific Actor run'
                }
            ]
        },
        {
            id: 'storage',
            name: 'Data Storage', 
            description: 'Access datasets and key-value stores',
            defaultEnabled: false,
            tools: [
                {
                    id: 'get-dataset',
                    name: 'Get Dataset',
                    description: 'Get metadata about a specific dataset'
                },
                {
                    id: 'get-dataset-items',
                    name: 'Get Dataset Items',
                    description: 'Retrieve dataset items with pagination/filtering'
                },
                {
                    id: 'get-dataset-list',
                    name: 'List Datasets',
                    description: 'List all datasets for the user'
                },
                {
                    id: 'get-dataset-schema',
                    name: 'Get Dataset Schema',
                    description: 'Get the JSON schema of dataset items'
                },
                {
                    id: 'get-key-value-store',
                    name: 'Get Key-Value Store',
                    description: 'Get metadata for a key-value store'
                },
                {
                    id: 'get-key-value-store-keys',
                    name: 'List Store Keys',
                    description: 'List keys in a specific key-value store'
                },
                {
                    id: 'get-key-value-store-record',
                    name: 'Get Store Record',
                    description: 'Get a value by key from a key-value store'
                },
                {
                    id: 'get-key-value-store-list',
                    name: 'List Key-Value Stores',
                    description: 'List all key-value stores'
                }
            ]
        }
    ],
    defaultActors: [
        {
            id: 'apify/rag-web-browser',
            name: 'RAG Web Browser',
            description: 'Preloaded Actor for browsing the web via RAG',
            defaultEnabled: true
        }
    ]
};
```

### 2. Update State Management

**File:** `assets/js/app.js`

Update global state variables:

```javascript
// Replace current selectedTools with more granular selection
let selectedToolCategories = ['actors', 'docs'];  // Default categories 
let selectedIndividualTools = [];  // Individual tools within categories
let selectedActors = ['apify/rag-web-browser'];  // Include default actor
let enableDynamicActors = true;  // Maps to tools=add-actor in experimental category
```

### 3. Update UI Rendering

**File:** `assets/js/app.js`

Update `renderToolsGrid()` function:

- Render categories with expandable sections
- Show individual tools within each category
- Support mixed selection (category-level and tool-level)
- Update styling to accommodate hierarchical structure

### 4. Fix URL Generation Logic

**File:** `assets/js/app.js`

Completely rewrite `generateMcpUrl()` function:

```javascript
function generateMcpUrl() {
    const baseUrl = "https://mcp.apify.com/";
    const queryParams = [];
    
    // Collect all selected tools
    const allSelectedTools = [];
    
    // Add selected categories
    selectedToolCategories.forEach(categoryId => {
        allSelectedTools.push(categoryId);
    });
    
    // Add individual tools
    selectedIndividualTools.forEach(toolId => {
        allSelectedTools.push(toolId);
    });
    
    // Add dynamic actors (experimental/add-actor) 
    if (enableDynamicActors) {
        if (!allSelectedTools.includes('experimental') && !allSelectedTools.includes('add-actor')) {
            allSelectedTools.push('add-actor');
        }
    }
    
    // Add selected individual actors
    if (selectedActors.length > 0) {
        selectedActors.forEach(actorPath => {
            allSelectedTools.push(actorPath);
        });
    }
    
    // Only add tools parameter if tools are explicitly selected
    // If no tools selected, let server use defaults (actors,docs,apify/rag-web-browser)
    if (allSelectedTools.length > 0) {
        queryParams.push(`tools=${allSelectedTools.join(",")}`);
    }
    
    return queryParams.length ? `${baseUrl}?${queryParams.join("&")}` : baseUrl;
}
```

### 5. Update Configuration Generation

**Files:** `assets/js/app.js`

Update all configuration generation functions:
- `generateServerConfig()`
- `buildJsonConfig()`
- Various integration examples

Remove all references to:
- `enableAddingActors` parameter
- Old tool mapping logic
- Hardcoded tool lists

### 6. Update Default Behavior

**File:** `assets/js/app.js`

Update initialization to match v2 defaults:

```javascript
// New defaults matching v2 specification
let selectedToolCategories = ['actors', 'docs'];
let selectedActors = ['apify/rag-web-browser']; 
let enableDynamicActors = true;  // Will add 'add-actor' to tools
```

### 7. Update UI Components

**File:** `index.html` + `assets/js/app.js`

- Update tools section to support hierarchical selection
- Add category-level checkboxes with expand/collapse
- Add individual tool checkboxes within categories  
- Update styling for new structure
- Add default actors section separate from user-selected actors

### 8. Update Integration Examples

**File:** `assets/js/app.js`

Update all integration examples to reflect new URL structure:
- Claude Desktop JSON examples
- Claude Code command examples  
- Python SDK examples
- TypeScript SDK examples
- All other client configurations

## Implementation Steps

### Phase 1: Backend Logic (High Priority)

1. **Update tools data structure** (`TOOLS_DATA`)
2. **Fix URL generation** (`generateMcpUrl()`)
3. **Update state management** (global variables)
4. **Test URL generation** with various tool combinations

### Phase 2: UI Updates (Medium Priority) 

1. **Update tools grid rendering** (`renderToolsGrid()`)
2. **Add hierarchical tool selection UI**
3. **Update default actors display**
4. **Test user interactions**

### Phase 3: Integration Examples (Low Priority)

1. **Update all configuration generators**
2. **Update integration modal examples**
3. **Test all integration paths**
4. **Update documentation references**

## Testing Requirements

### URL Generation Tests

Test the following URL generation scenarios:

1. **Default case (no tools param):**
   - Expected: `https://mcp.apify.com/` 
   - Should rely on server defaults: `actors,docs,apify/rag-web-browser`

2. **Category selection:**
   - Input: `['actors', 'runs']`
   - Expected: `https://mcp.apify.com/?tools=actors,runs`

3. **Individual tool selection:**  
   - Input: `['search-actors', 'get-dataset']`
   - Expected: `https://mcp.apify.com/?tools=search-actors,get-dataset`

4. **Mixed selection:**
   - Input: categories `['actors']`, individual `['get-dataset']`, actors `['apify/my-actor']`
   - Expected: `https://mcp.apify.com/?tools=actors,get-dataset,apify/my-actor`

5. **Dynamic actors enabled:**
   - Input: `enableDynamicActors = true`
   - Expected: URL should include `add-actor` tool

6. **Legacy compatibility:**
   - Ensure old URLs still work on server side
   - No breaking changes for existing integrations

### UI Testing

1. **Category selection UI**
2. **Individual tool selection UI** 
3. **Default actor display**
4. **URL updates in real-time**
5. **Copy functionality works**
6. **Integration examples update correctly**

## Migration Risks & Considerations

### Backward Compatibility

- **Risk:** Existing user bookmarks/integrations may break
- **Mitigation:** Ensure server supports both v1 and v2 URL formats during transition

### UI Complexity

- **Risk:** New hierarchical UI may confuse users
- **Mitigation:** Provide clear defaults and progressive disclosure

### URL Length 

- **Risk:** URLs may become very long with many individual tools
- **Mitigation:** Encourage category-level selection where appropriate

### Testing Coverage

- **Risk:** Complex logic may introduce bugs
- **Mitigation:** Comprehensive testing of all URL generation scenarios

## Success Criteria

1. ✅ **URL Generation:** All v2 tool combinations generate correct URLs
2. ✅ **UI Functionality:** Users can select categories and individual tools 
3. ✅ **Integration Examples:** All client examples work with generated URLs
4. ✅ **Default Behavior:** Matches v2 specification exactly
5. ✅ **Backward Compatibility:** Existing integrations continue to work
6. ✅ **Performance:** No significant performance degradation

## Files to Modify

### Primary Files
- `assets/js/app.js` - Main application logic (major changes)
- `index.html` - UI structure updates (minor changes)

### Secondary Files  
- `assets/css/styles.css` - Styling for new UI components (minor changes)
- `README.md` - Update documentation if needed

### Testing
- Manual testing of all tool combinations
- Cross-browser testing of new UI components
- Integration testing with actual MCP server

---

*This plan should be executed in phases with thorough testing at each step to ensure a smooth migration to the v2 tools configuration system.*