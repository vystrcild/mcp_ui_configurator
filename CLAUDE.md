# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla HTML/CSS/JavaScript dashboard for configuring Apify MCP (Model Context Protocol) servers. The application was converted from a Next.js/React codebase to pure web technologies to run on Express.js servers without build processes.

## Development Commands

- `npm start` - Start local server using `serve` package
- `npm run dev` - Start development server on port 3000

## Architecture

### Single-Page Application Structure
- **index.html** - Main application entry point with complete UI structure
- **assets/css/styles.css** - All styling using CSS variables (converted from Tailwind)
- **assets/js/app.js** - Main application logic with vanilla JavaScript
- **assets/js/data.js** - Static data for actors and tools
- **assets/images/** - Static assets (logos, placeholders)

### Core Functionality
The application manages a single MCP server configuration with three main features:

1. **Actor Selection** - Users browse and select Apify actors from `ACTORS_DATA`
2. **Tool Configuration** - Users enable/disable optional tools from `TOOLS_DATA` 
3. **Configuration Generation** - Outputs MCP server URL and JSON config for Claude Desktop

### State Management
Global state is managed in `app.js` with simple variables:
- `selectedActors[]` - Currently selected Apify actors
- `selectedTools[]` - Currently enabled optional tools  
- `enableDynamicActors` - Boolean for dynamic actor addition
- `useToken` - Boolean for token vs OAuth authentication

### Key Functions
- `generateServerConfig()` - Creates JSON config for MCP clients
- `generateMcpUrl()` - Creates URL for `https://mcp.apify.com/`
- `renderSelectedActors()` - Updates actor display in UI
- `renderToolsGrid()` - Updates tool selection interface

### Data Structure
- **ACTORS_DATA** - Array of Apify actor objects with `id`, `title`, `path`, `description`, `icon`
- **TOOLS_DATA** - Array of optional tool objects with `id`, `name`, `description`, `category`

The tool mapping system converts internal IDs to MCP parameter names:
- `tool_apify_docs` → `"docs"`
- `tool_actor_runs` → `"runs"` 
- `tool_apify_storage` → `"storage"`

### CSS Architecture
Uses CSS custom properties (variables) for theming with light/dark mode support. Component-based styling with BEM-like naming for cards, buttons, modals, and form elements.

## Express.js Integration

This application is designed to be served as static files from an Express.js server:

```javascript
app.use('/dashboard', express.static('./path-to-mcp-dashboard'));
```

No build process, transpilation, or bundling required.


## Rules
- Always use "Actor" with capitalized "A" in text (but not in ids or urls)