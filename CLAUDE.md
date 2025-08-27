# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- **Start development server**: `npm run dev`
  - Uses nodemon for automatic restarts
  - Server runs on `http://localhost:3000`
- **Start production server**: `npm start`
- **Serve static files only**: `npm run static`

### Code Quality
- **Run linter**: `npm run lint`
- **Format code**: `npm run format`

## Architecture Overview

This is a vanilla HTML/CSS/JavaScript dashboard for Apify MCP (Model Context Protocol) servers. The application serves as a configuration interface for setting up MCP integrations with various clients.

### Backend (Node.js/Express)
- **server.js**: Main Express server with security middleware (helmet, compression, rate limiting)
- **API endpoints**:
  - `/api/search/actors` - Search Apify Store actors
  - `/api/popular/actors` - Get popular actors
  - In-memory caching with 5-minute TTL
  - Rate limiting: 60 requests per minute on API routes

### Frontend Structure
- **index.html**: Main application interface with actor selection, tools configuration, and integration guides
- **chat.html**: Separate chat interface (Vite-built React app)
- **assets/js/app.js**: Main application logic (~28K lines)
  - Actor selection and management
  - Tools configuration
  - Integration modal system
  - Search functionality
- **assets/js/search.js**: Search utilities and API client code
- **assets/css/styles.css**: Complete styling system

### UI
- IMPORTANT: Please, always check first if some UI components already exist or not in styles.css, so you're not creating still the same thing over and over.

### Key Features
- **Actor Management**: Search and select Apify Store actors for MCP server configuration
- **Tools Configuration**: Enable/disable various MCP tools (actor discovery, documentation, runs, storage)
- **Integration Guides**: Step-by-step setup instructions for various MCP clients (Claude Desktop, VS Code, Cursor, etc.)
- **Dynamic Configuration**: Real-time MCP server URL generation and configuration copying

## API Integration

The application integrates with the **Apify Store API** (public endpoints only):
- Uses `https://api.apify.com/v2/store` for actor search and discovery
- No authentication required - public store data only
- Implements response transformation to normalize actor data
- Handles pagination with configurable limits (max 50 items per request)

## Security Considerations

- Content Security Policy configured via Helmet
- Rate limiting on API routes
- Input sanitization and HTML escaping in frontend
- No sensitive data storage - uses public APIs only
- CORS properly configured for external integrations

## Development Notes

- **No build process** for main app - uses vanilla JavaScript
- **External dependencies**: Prism.js for syntax highlighting, GitHub buttons
- **Responsive design**: Mobile-first approach with sidebar/topbar layout
- **Error handling**: Comprehensive error handling for API failures and network issues
- **Accessibility**: ARIA labels and keyboard navigation support

## Testing

No specific test framework is configured. Manual testing is performed against the running server and API endpoints.