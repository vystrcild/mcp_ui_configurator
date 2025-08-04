// Actors data - sample data for testing the new design
const ACTORS_DATA = [
  {
    id: "apify~website-content-crawler",
    title: "Website Content Crawler",
    path: "apify/website-content-crawler",
    description: "Crawl websites and extract text content to feed AI models, LLM applications, vector databases, or RAG pipelines. The Actor...",
    icon: "https://apify.com/storage/actor-avatars/6UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Apify",
    userAvatar: "https://apify.com/img/apify-logo/logomark-32x32.svg",
    stats: {
      totalRuns: 66000,
      avgRating: 4.3
    }
  },
  {
    id: "apify~web-scraper",
    title: "Web Scraper",
    path: "apify/web-scraper",
    description: "Crawls arbitrary websites using a web browser and extracts structured data from web pages using a provided JavaScript...",
    icon: "https://apify.com/storage/actor-avatars/4UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Apify",
    userAvatar: "https://apify.com/img/apify-logo/logomark-32x32.svg",
    stats: {
      totalRuns: 91000,
      avgRating: 4.4
    }
  },
  {
    id: "apify~rag-web-browser",
    title: "RAG Web Browser",
    path: "apify/rag-web-browser",
    description: "Web browser for OpenAI Assistants, RAG pipelines, or AI agents, similar to a web browser in ChatGPT. It queries Google...",
    icon: "https://apify.com/storage/actor-avatars/7UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Apify",
    userAvatar: "https://apify.com/img/apify-logo/logomark-32x32.svg",
    stats: {
      totalRuns: 5000,
      avgRating: 4.4
    }
  },
  {
    id: "apify~screenshot-url",
    title: "Website Screenshot Generator",
    path: "apify/screenshot-url",
    description: "Create a screenshot of a website based on a specified URL. The screenshot is stored as a key-value store. It can be...",
    icon: "https://apify.com/storage/actor-avatars/8UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Apify",
    userAvatar: "https://apify.com/img/apify-logo/logomark-32x32.svg",
    stats: {
      totalRuns: 4000,
      avgRating: 4.5
    }
  },
  {
    id: "tri~website-changes-detector",
    title: "Website Changes Detector",
    path: "tri.angle/website-changes-detector",
    description: "This actor uses Apify's Website Content Crawler to track website changes by comparing new and previous crawl results...",
    icon: "https://apify.com/storage/actor-avatars/9UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Triangle",
    userAvatar: "https://apify.com/storage/actor-avatars/tri-logo.png",
    stats: {
      totalRuns: 27,
      avgRating: 3.0
    }
  },
  {
    id: "creative~extract-contact-details",
    title: "Extract Contact Details from Any Website - Email, Phone, Numbers",
    path: "creative_tablecoth/extract-email-...",
    description: "Discover our powerful scraper that effortlessly extracts emails, phone numbers, and social media links from any website. Ide...",
    icon: "https://apify.com/storage/actor-avatars/10UH24sIIFbIXnpyH6K80RZ9s15nCf2qy.png",
    username: "Jinny Kim",
    userAvatar: "https://apify.com/storage/actor-avatars/jinny-avatar.png",
    stats: {
      totalRuns: 1800,
      avgRating: 3.0
    }
  }
];

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