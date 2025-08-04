import type { Tool } from "@/app/types"

export const TOOLS_DATA: Tool[] = [
  // Default tools (always enabled)
  {
    id: "tool_actor_discovery",
    name: "Actor discovery and management",
    description: "Search for Actors, view details, and dynamically add them to your server.",
    category: "default",
    toolNames: [
      {
        name: "search-actors",
        description: "Search through the Apify Store to find Actors matching your criteria",
      },
      {
        name: "get-actor-details",
        description:
          "Retrieve detailed information about a specific Actor including inputs, outputs, and documentation",
      },
      {
        name: "add-actor",
        description: "Dynamically add new Actors to your MCP server configuration",
      },
    ],
  },
  // Optional tools (must be explicitly enabled)
  {
    id: "tool_apify_docs",
    name: "Apify documentation",
    description: "Search Apify documentation and fetch specific documents for development help.",
    category: "optional",
    toolNames: [
      {
        name: "search-apify-docs",
        description: "Search through Apify's comprehensive documentation to find relevant guides and API references",
      },
      {
        name: "fetch-apify-docs",
        description: "Retrieve the full content of specific documentation pages for detailed information",
      },
    ],
  },
  {
    id: "tool_actor_runs",
    name: "Actor runs",
    description: "Monitor and manage your Actor executions, view results, and access logs.",
    category: "optional",
    toolNames: [
      {
        name: "get-actor-run-list",
        description: "Get a paginated list of all your Actor runs with status, duration, and basic metadata",
      },
      {
        name: "get-actor-run",
        description:
          "Retrieve detailed information about a specific Actor run including inputs, outputs, and statistics",
      },
      {
        name: "get-actor-log",
        description: "Access the complete execution logs from a specific Actor run for debugging and monitoring",
      },
    ],
  },
  {
    id: "tool_apify_storage",
    name: "Apify storage",
    description: "Access and manage your data stored in Apify's datasets and key-value stores.",
    category: "optional",
    toolNames: [
      {
        name: "get-dataset",
        description: "Retrieve metadata and information about a specific dataset including item count and size",
      },
      {
        name: "get-dataset-items",
        description: "Fetch items from a dataset with support for pagination, filtering, and format selection",
      },
      {
        name: "get-dataset-list",
        description: "Get a list of all your datasets with basic metadata and statistics",
      },
      {
        name: "get-key-value-store",
        description: "Retrieve information about a specific key-value store including size and key count",
      },
      {
        name: "get-key-value-store-keys",
        description: "List all keys available in a key-value store with optional filtering and pagination",
      },
      {
        name: "get-key-value-store-record",
        description: "Fetch a specific record from a key-value store by its key",
      },
      {
        name: "get-key-value-store-records",
        description: "Retrieve multiple records from a key-value store with batch operations support",
      },
    ],
  },
]
