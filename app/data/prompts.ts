import type { Prompt } from "@/app/types"

export const PROMPTS_DATA: Prompt[] = [
  {
    id: "prompt_1",
    name: "lead-generation-analysis",
    description: "Analyze scraped data to identify and qualify potential leads based on specific criteria.",
    content:
      "You are a lead generation specialist. Analyze the following data scraped from {{platform}} and identify potential leads based on these criteria:\n\n" +
      "Target criteria:\n- {{criteria}}\n\n" +
      "Scraped data:\n{{data}}\n\n" +
      "Please provide:\n1. A list of qualified leads with contact information\n2. Lead scoring (1-10) based on fit\n3. Recommended outreach approach for each lead\n4. Key insights about the target market",
    arguments: [
      {
        id: "arg_1_1",
        name: "platform",
        description: "The platform where data was scraped from (e.g., LinkedIn, Apollo, etc.)",
        required: true,
      },
      {
        id: "arg_1_2",
        name: "criteria",
        description: "Specific criteria for lead qualification (job title, company size, industry, etc.)",
        required: true,
      },
      {
        id: "arg_1_3",
        name: "data",
        description: "The raw scraped data to analyze",
        required: true,
      },
    ],
  },
  {
    id: "prompt_2",
    name: "influencer-outreach-strategy",
    description:
      "Create personalized outreach strategies for identified influencers based on their content and engagement.",
    content:
      "You are a social media marketing expert. Based on the influencer data scraped from {{platform}}, create a personalized outreach strategy:\n\n" +
      "Influencer Profile:\n{{influencer_data}}\n\n" +
      "Campaign Details:\n- Product/Service: {{product}}\n- Target Audience: {{target_audience}}\n- Budget Range: {{budget}}\n\n" +
      "Please provide:\n1. Personalized outreach message template\n2. Suggested collaboration type (sponsored post, story, reel, etc.)\n3. Estimated engagement and reach\n4. Negotiation talking points\n5. Content guidelines and brand alignment assessment",
    arguments: [
      {
        id: "arg_2_1",
        name: "platform",
        description: "Social media platform (Instagram, TikTok, YouTube, etc.)",
        required: true,
      },
      {
        id: "arg_2_2",
        name: "influencer_data",
        description: "Scraped influencer profile data including follower count, engagement rate, recent posts",
        required: true,
      },
      {
        id: "arg_2_3",
        name: "product",
        description: "Product or service to promote",
        required: true,
      },
      {
        id: "arg_2_4",
        name: "target_audience",
        description: "Target audience demographics and interests",
        required: false,
      },
      {
        id: "arg_2_5",
        name: "budget",
        description: "Available budget for the collaboration",
        required: false,
      },
    ],
  },
  {
    id: "prompt_3",
    name: "restaurant-recommendation-engine",
    description:
      "Generate personalized restaurant recommendations based on location data, reviews, and user preferences.",
    content:
      "You are a local dining expert. Based on the restaurant data scraped from Google Maps for {{location}}, provide personalized recommendations:\n\n" +
      "User Preferences:\n- Cuisine Type: {{cuisine}}\n- Price Range: {{price_range}}\n- Dietary Restrictions: {{dietary_restrictions}}\n- Occasion: {{occasion}}\n\n" +
      "Restaurant Data:\n{{restaurant_data}}\n\n" +
      "Please provide:\n1. Top 5 restaurant recommendations with reasoning\n2. Best dishes to try at each restaurant (based on reviews)\n3. Optimal visit times and reservation tips\n4. Alternative options if first choices are unavailable\n5. Local dining insights and hidden gems",
    arguments: [
      {
        id: "arg_3_1",
        name: "location",
        description: "Geographic area or specific location for restaurant search",
        required: true,
      },
      {
        id: "arg_3_2",
        name: "restaurant_data",
        description: "Scraped restaurant data including ratings, reviews, menu items, hours",
        required: true,
      },
      {
        id: "arg_3_3",
        name: "cuisine",
        description: "Preferred cuisine type or style",
        required: false,
      },
      {
        id: "arg_3_4",
        name: "price_range",
        description: "Budget preference (e.g., $, $$, $$$, $$$$)",
        required: false,
      },
      {
        id: "arg_3_5",
        name: "dietary_restrictions",
        description: "Any dietary restrictions or preferences (vegetarian, gluten-free, etc.)",
        required: false,
      },
      {
        id: "arg_3_6",
        name: "occasion",
        description: "Type of dining occasion (casual, business, romantic, family, etc.)",
        required: false,
      },
    ],
  },
]
