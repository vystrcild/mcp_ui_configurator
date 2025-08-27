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

1. **Legacy parameter**: Uses `enableAddingActors=true/false` instead of new `tools=add-actor`
2. **Missing default tools**: Default tools (`tool_actor_discovery`, `tool_apify_docs`) are not included in URL
3. **Incomplete tool mapping**: Only maps `runs` and `storage`, missing many v2 tools
4. **No individual tool support**: Cannot select individual tools within categories
5. **Missing default actor**: No support for `apify/rag-web-browser` default actor

### Current Tool Selection Logic

- `selectedTools` defaults to `['tool_actor_discovery']`
- Only optional tools are mapped to URL parameters
- Default tools are assumed to always be available

## Required Changes for v2

### ⚠️ **CRITICAL INSIGHT**: Individual Tool Selection, Not Categories

The key difference in v2 is:
- **UI**: Tools are grouped by categories for visual organization
- **Selection Logic**: Each individual tool has its own checkbox and can be enabled/disabled
- **URL Generation**: Smart optimization - use category names when all tools in a category are selected, otherwise use individual tool names
- **State Management**: Track individual tool selections, not category selections

**UI Mockup Example:**
```
[Tools]
┌─ Actor Management                    [☐ Select All]
│  ☑ Search Actors  
│  ☑ Actor Details
│  ☑ Call Actor
│  
├─ Documentation                       [☐ Select All] 
│  ☑ Search Documentation
│  ☑ Fetch Documentation
│  
├─ Experimental Features               [☐ Select All]
│  ☐ Dynamic Actor Addition
│  
├─ Actor Runs                          [☐ Select All]
│  ☐ Get Actor Run
│  ☐ List Actor Runs
│  ☐ Get Run Logs
│  
└─ Data Storage                        [☐ Select All]
   ☐ Get Dataset
   ☐ Get Dataset Items  
   ...
```

### 1. Update Tools Data Structure

**File:** `assets/js/app.js`

Replace `TOOLS_DATA` array with new v2 structure based on individual tool selection:

```javascript
const TOOLS_DATA = {
    // Tool definitions with category grouping for UI display
    tools: [
        // actors category
        {
            id: 'search-actors',
            name: 'Search Actors',
            description: 'Search for Actors in the Apify Store',
            category: 'actors',
            categoryName: 'Actor Management',
            defaultEnabled: true
        },
        {
            id: 'fetch-actor-details',
            name: 'Actor Details', 
            description: 'Retrieve detailed information about a specific Actor',
            category: 'actors',
            categoryName: 'Actor Management',
            defaultEnabled: true
        },
        {
            id: 'call-actor',
            name: 'Call Actor',
            description: 'Generic tool to call any Actor by ID and input',
            category: 'actors', 
            categoryName: 'Actor Management',
            defaultEnabled: true
        },
        // docs category
        {
            id: 'search-apify-docs',
            name: 'Search Documentation',
            description: 'Search the Apify documentation',
            category: 'docs',
            categoryName: 'Documentation',
            defaultEnabled: true
        },
        {
            id: 'fetch-apify-docs',
            name: 'Fetch Documentation',
            description: 'Fetch the full content of a documentation page',
            category: 'docs',
            categoryName: 'Documentation', 
            defaultEnabled: true
        },
        // experimental category
        {
            id: 'add-actor',
            name: 'Dynamic Actor Addition',
            description: 'Add an Actor as a new tool for the session',
            category: 'experimental',
            categoryName: 'Experimental Features',
            defaultEnabled: false
        },
        // runs category
        {
            id: 'get-actor-run',
            name: 'Get Actor Run',
            description: 'Get detailed information about a specific Actor run',
            category: 'runs',
            categoryName: 'Actor Runs',
            defaultEnabled: false
        },
        {
            id: 'get-actor-run-list',
            name: 'List Actor Runs',
            description: 'Get a list of an Actor\'s runs, filterable by status',
            category: 'runs',
            categoryName: 'Actor Runs', 
            defaultEnabled: false
        },
        {
            id: 'get-actor-log',
            name: 'Get Run Logs',
            description: 'Retrieve the logs for a specific Actor run',
            category: 'runs',
            categoryName: 'Actor Runs',
            defaultEnabled: false
        },
        // storage category
        {
            id: 'get-dataset',
            name: 'Get Dataset',
            description: 'Get metadata about a specific dataset',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-dataset-items',
            name: 'Get Dataset Items',
            description: 'Retrieve dataset items with pagination/filtering',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-dataset-list',
            name: 'List Datasets',
            description: 'List all datasets for the user',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-dataset-schema',
            name: 'Get Dataset Schema',
            description: 'Get the JSON schema of dataset items',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-key-value-store',
            name: 'Get Key-Value Store',
            description: 'Get metadata for a key-value store',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-key-value-store-keys',
            name: 'List Store Keys',
            description: 'List keys in a specific key-value store',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-key-value-store-record',
            name: 'Get Store Record',
            description: 'Get a value by key from a key-value store',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        },
        {
            id: 'get-key-value-store-list',
            name: 'List Key-Value Stores',
            description: 'List all key-value stores',
            category: 'storage',
            categoryName: 'Data Storage',
            defaultEnabled: false
        }
    ],
    // Categories for UI organization
    categories: [
        { id: 'actors', name: 'Actor Management', description: 'Search, discover, and call Apify Actors' },
        { id: 'docs', name: 'Documentation', description: 'Search and access Apify documentation' },
        { id: 'experimental', name: 'Experimental Features', description: 'Beta features for advanced users' },
        { id: 'runs', name: 'Actor Runs', description: 'Monitor and manage Actor executions' },
        { id: 'storage', name: 'Data Storage', description: 'Access datasets and key-value stores' }
    ],
    // Default actors (separate from tools)
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

Update global state variables to track individual tools:

```javascript
// Track individual tools that are enabled (not categories)
let selectedTools = [
    // Default enabled tools from v2 spec
    'search-actors',
    'fetch-actor-details', 
    'call-actor',
    'search-apify-docs',
    'fetch-apify-docs'
];  
let selectedActors = ['apify/rag-web-browser'];  // Include default actor
// Remove enableDynamicActors - now controlled by 'add-actor' tool selection
```

### 3. Update UI Rendering

**File:** `assets/js/app.js`

Update `renderToolsGrid()` function:

- Group tools visually by category (for UI organization)
- **Each tool has its own individual checkbox** (this is the key change)
- Add "Select All" checkbox per category for convenience:
  - When clicked: selects/deselects all tools in that category
  - Updates automatically based on individual tool states (checked when all selected, indeterminate when some selected)
- Update styling to show tool hierarchy within categories
- Remove concept of "default" vs "optional" categories - now all tools are individually selectable

### 4. Fix URL Generation Logic

**File:** `assets/js/app.js`

Completely rewrite `generateMcpUrl()` function with **smart category optimization**:

```javascript
function generateMcpUrl() {
    const baseUrl = "https://mcp.apify.com/";
    const queryParams = [];
    const allSelectedTools = [];
    
    // Smart optimization: if all tools in a category are selected, use category name
    // Otherwise, use individual tool names
    const toolsByCategory = {};
    TOOLS_DATA.tools.forEach(tool => {
        if (!toolsByCategory[tool.category]) {
            toolsByCategory[tool.category] = { all: [], selected: [] };
        }
        toolsByCategory[tool.category].all.push(tool.id);
        if (selectedTools.includes(tool.id)) {
            toolsByCategory[tool.category].selected.push(tool.id);
        }
    });
    
    // For each category, decide whether to use category name or individual tools
    Object.keys(toolsByCategory).forEach(categoryId => {
        const category = toolsByCategory[categoryId];
        if (category.selected.length === 0) {
            // No tools selected from this category
            return;
        } else if (category.selected.length === category.all.length) {
            // All tools selected - use category name for optimization
            allSelectedTools.push(categoryId);
        } else {
            // Some tools selected - use individual tool names
            allSelectedTools.push(...category.selected);
        }
    });
    
    // Add selected individual actors
    if (selectedActors.length > 0) {
        selectedActors.forEach(actorPath => {
            allSelectedTools.push(actorPath);
        });
    }
    
    // Check if current selection matches server defaults exactly
    const defaultTools = ['search-actors', 'fetch-actor-details', 'call-actor', 'search-apify-docs', 'fetch-apify-docs'];
    const defaultActors = ['apify/rag-web-browser'];
    const isDefaultSelection = 
        selectedTools.length === defaultTools.length &&
        selectedTools.every(tool => defaultTools.includes(tool)) &&
        selectedActors.length === defaultActors.length &&
        selectedActors.every(actor => defaultActors.includes(actor));
    
    // If using defaults, return base URL (let server handle defaults)
    if (isDefaultSelection) {
        return baseUrl;
    }
    
    // Otherwise, include tools parameter
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
- `enableAddingActors` parameter (replaced by `add-actor` tool selection)
- `tool_actor_discovery`, `tool_apify_docs`, etc. (replaced by actual tool IDs)
- Old tool mapping logic (`tool_actor_runs: "runs"`)
- Hardcoded \"default\" vs \"optional\" categories
- Category-based selection logic

### 6. Update Default Behavior

**File:** `assets/js/app.js`

Update initialization to match v2 defaults exactly:

```javascript
// New defaults matching v2 specification (individual tools)
let selectedTools = [
    'search-actors',
    'fetch-actor-details',
    'call-actor', 
    'search-apify-docs',
    'fetch-apify-docs'
];  // These are the default ✅ tools from v2 spec
let selectedActors = ['apify/rag-web-browser']; 
// Note: 'add-actor' is not selected by default (❌ in v2 spec)
```

### 7. Update UI Components

**File:** `index.html` + `assets/js/app.js`

- **Individual checkboxes for each tool** (primary interaction)
- Group tools visually by category with category headers
- Add "Select All" convenience checkbox per category
- Remove "Default Tools" vs "Optional Tools" sections
- Show all tools with their individual enable/disable state
- Add default actors section separate from user-selected actors
- Update event handlers to work with individual tool selection

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
2. **Add individual tool checkboxes** (one per tool)
3. **Add category grouping and "Select All" convenience checkboxes**
4. **Update default actors display** 
5. **Test individual tool selection interactions**

### Phase 3: Integration Examples (Low Priority)

1. **Update all configuration generators**
2. **Update integration modal examples**
3. **Test all integration paths**
4. **Update documentation references**

## Testing Requirements
Note: Testing will be done manually by user - no need to implement tests in the code!

### URL Generation Tests

Test the following URL generation scenarios:

1. **Default case (no tools param):**
   - Expected: `https://mcp.apify.com/` 
   - Should rely on server defaults: `actors,docs,apify/rag-web-browser`

2. **All tools in category selected (optimization):**
   - Input: All 'actors' tools + all 'runs' tools selected
   - Expected: `https://mcp.apify.com/?tools=actors,runs`

3. **Individual tool selection:**  
   - Input: `['search-actors', 'get-dataset']`
   - Expected: `https://mcp.apify.com/?tools=search-actors,get-dataset`

4. **Mixed selection:**
   - Input: All 'actors' tools + some 'storage' tools + custom actors
   - Expected: `https://mcp.apify.com/?tools=actors,get-dataset,get-dataset-items,apify/my-actor`

5. **Add-actor tool enabled:**
   - Input: `selectedTools` includes `'add-actor'`
   - Expected: URL should include `add-actor` tool

6. **Legacy compatibility:**
   - Ensure old URLs still work on server side
   - No breaking changes for existing integrations

### UI Testing

1. **Individual tool checkboxes work correctly**
2. **Category "Select All" convenience checkboxes work**
3. **URL updates in real-time when individual tools are toggled**
4. **Category optimization works (shows category name when all tools selected)**
5. **Default actor display**
6. **Copy functionality works**
7. **Integration examples update correctly**


### UI Complexity

- **Risk:** Individual tool selection may overwhelm users
- **Mitigation:** Provide clear defaults, category grouping, and "Select All" convenience options


## Files to Modify

### Primary Files
- `assets/js/app.js` - Main application logic (major changes)
- `index.html` - UI structure updates (minor changes)

### Secondary Files  
- `assets/css/styles.css` - Styling for new UI components (minor changes)
- `README.md` - Update documentation if needed

### Testing
- Manual testing of all tool combinations

---

*This plan should be executed in phases with thorough testing at each step to ensure a smooth migration to the v2 tools configuration system.*