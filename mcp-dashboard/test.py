from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    input="Run the Apify: Fetch Dataset Items tool",
    tool_choice="required",
    tools=[
        {
            "type": "mcp",
            "server_label": "apify",
            "server_url": "https://mcp.apify.com",
            "require_approval": "never",
            "headers": {
                "Authorization": "Bearer apify_api_key",
            },
        }
    ],
)

print(response)