import type { Actor, Prompt } from "@/app/types"
import { ACTORS_DATA } from "./actors"

export type GalleryTemplate = {
  id: string
  category: "Marketing" | "AI" | "Lead Generation" | "E-commerce" | "SEO Tools" | "Travel" | "Automation"
  logo: string
  name: string
  description: string
  actors: Actor[]
  author: string
  users: string
  defaultTools: string[]
  prompts?: Prompt[]
}

export const GALLERY_CATEGORIES = [
  "Marketing",
  "AI",
  "Lead Generation",
  "E-commerce",
  "SEO Tools",
  "Travel",
  "Automation",
] as const

export const GALLERY_DATA: GalleryTemplate[] = [
  // Marketing
  {
    id: "gallery_mkt_1",
    category: "Marketing",
    logo: "/placeholder.svg?width=48&height=48",
    name: "Social Media Monitor",
    description: "Track brand mentions and sentiment across Instagram and X (Twitter).",
    actors: [ACTORS_DATA[4], ACTORS_DATA[5]],
    author: "Apify",
    users: "2.5k",
    defaultTools: ["tool_1", "tool_2"],
  },
  // AI
  {
    id: "gallery_ai_1",
    category: "AI",
    logo: "/placeholder.svg?width=48&height=48",
    name: "AI Content Feed",
    description: "Crawl website content to feed into your RAG pipelines and LLM applications.",
    actors: [ACTORS_DATA[0]],
    author: "Apify",
    users: "3.1k",
    defaultTools: ["tool_1", "tool_3"],
  },
  // Lead Generation
  {
    id: "gallery_lg_1",
    category: "Lead Generation",
    logo: "/placeholder.svg?width=48&height=48",
    name: "Apollo Lead Finder",
    description: "Automate lead discovery from Apollo.io to feed your sales pipeline.",
    actors: [ACTORS_DATA[1]],
    author: "Code Pioneer",
    users: "1.2k",
    defaultTools: ["tool_1"],
    prompts: [
      {
        id: "gallery_prompt_lg_1",
        name: "qualify-apollo-leads",
        description: "Analyze and qualify leads scraped from Apollo based on specific business criteria.",
        content:
          "You are a lead qualification specialist. Analyze the following leads scraped from Apollo and qualify them based on these criteria:\n\n" +
          "Target Profile:\n- Company Size: {{company_size}}\n- Industry: {{target_industry}}\n- Job Titles: {{target_roles}}\n- Location: {{location}}\n\n" +
          "Lead Data:\n{{lead_data}}\n\n" +
          "For each lead, provide:\n1. Qualification score (1-10)\n2. Fit assessment (High/Medium/Low)\n3. Key decision-maker indicators\n4. Recommended outreach timing\n5. Personalization opportunities\n6. Potential objections and how to address them",
        arguments: [
          {
            id: "arg_lg_1_1",
            name: "company_size",
            description: "Target company size (e.g., 50-200 employees, Enterprise, etc.)",
            required: true,
          },
          {
            id: "arg_lg_1_2",
            name: "target_industry",
            description: "Target industry or vertical",
            required: true,
          },
          {
            id: "arg_lg_1_3",
            name: "target_roles",
            description: "Target job titles or roles (e.g., VP Sales, Marketing Director)",
            required: true,
          },
          {
            id: "arg_lg_1_4",
            name: "location",
            description: "Geographic location preference",
            required: false,
          },
          {
            id: "arg_lg_1_5",
            name: "lead_data",
            description: "Raw lead data scraped from Apollo",
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: "gallery_lg_2",
    category: "Lead Generation",
    logo: "/placeholder.svg?width=48&height=48",
    name: "Local Business Scraper",
    description: "Find local businesses and contact information from Google Maps.",
    actors: [ACTORS_DATA[3]],
    author: "Compass",
    users: "4.8k",
    defaultTools: ["tool_1", "tool_2"],
  },
  // E-commerce
  {
    id: "gallery_ecom_1",
    category: "E-commerce",
    logo: "/placeholder.svg?width=48&height=48",
    name: "E-commerce Price Tracker",
    description: "Monitor competitor prices and product availability on popular e-commerce sites.",
    actors: [], // User would add a specific e-commerce scraper
    author: "Apify",
    users: "980",
    defaultTools: ["tool_1", "tool_2", "tool_3"],
  },
  // SEO Tools
  {
    id: "gallery_seo_1",
    category: "SEO Tools",
    logo: "/placeholder.svg?width=48&height=48",
    name: "SEO Content Auditor",
    description: "Crawl a website to analyze content, find broken links, and check for SEO best practices.",
    actors: [ACTORS_DATA[0]],
    author: "Apify",
    users: "1.9k",
    defaultTools: ["tool_1", "tool_6"],
  },
  // Travel
  {
    id: "gallery_travel_1",
    category: "Travel",
    logo: "/placeholder.svg?width=48&height=48",
    name: "Travel Deal Finder",
    description: "Scrape travel sites for the best deals on flights and hotels.",
    actors: [], // User would add a specific travel scraper
    author: "Apify",
    users: "750",
    defaultTools: ["tool_1", "tool_2"],
  },
  // Automation
  {
    id: "gallery_auto_1",
    category: "Automation",
    logo: "/placeholder.svg?width=48&height=48",
    name: "Data Aggregator",
    description: "A general-purpose server to aggregate data from multiple sources.",
    actors: [ACTORS_DATA[0], ACTORS_DATA[3], ACTORS_DATA[4]],
    author: "Apify",
    users: "5.2k",
    defaultTools: ["tool_1", "tool_2", "tool_3", "tool_5"],
  },
]
