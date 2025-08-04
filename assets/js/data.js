// Actors data - now empty, will be populated via API search
const ACTORS_DATA = [];

// Tools data - separated into default and optional
const TOOLS_DATA = [
  {
    id: "tool_actor_discovery",
    name: "Actor discovery and management",
    description: "Search for Actors, view details, and dynamically add them to your server.",
    category: "default",
  },
  {
    id: "tool_apify_docs",
    name: "Apify documentation",
    description: "Search Apify documentation and fetch specific documents for development help.",
    category: "optional",
  },
  {
    id: "tool_actor_runs",
    name: "Actor runs",
    description: "Monitor and manage your Actor executions, view results, and access logs.",
    category: "optional",
  },
  {
    id: "tool_apify_storage",
    name: "Apify storage",
    description: "Access and manage your data stored in Apify's datasets and key-value stores.",
    category: "optional",
  },
];