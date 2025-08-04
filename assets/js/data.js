// Actors data - now empty, will be populated via API search
const ACTORS_DATA = [];

// Tools data - only optional tools that can be enabled/disabled
const TOOLS_DATA = [
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