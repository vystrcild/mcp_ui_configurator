### Configuration v2 (2025-08) (proposal-living-spec)

The goal is to provide **more fine-grained control**, improve **developer experience**, and keep the system **backward compatible** where possible.

Key motivations:

- Allow enabling/disabling individual tools
- Simplify the configuration
- Prepare for future toolsets like `chatgpt`

**Main changes**

| Old (v1) | New (v2) |
| --- | --- |
| `tools` param with category names only | `tools` can include **categories or specific tools** |
| `enableAddingActors=true` | Now maps to `tools=add-actor` (experimental) |
| `actors` always enabled | Now merged into `tools` (still enabled by default unless overridden) |
| `call-actor` was optional | Now enabled **by default** unless tools param is specified |
| CLI: `--tools category1,category2` | Same format but now supports individual tools |
| Simplified Actor schema | ⚠️ Open decision (see below) |

**Details:**

- `tools` can include categories or specific tools. You can now configure the server to load full categories or individual tools. Example: `tools=storage,runs` loads two categories; `tools=add-actor` loads just one tool.
- `enableAddingActors=true` maps to `tools=add-actor` The legacy flag is deprecated. It’s replaced by `tools=add-actor`, now part of the `experimental` category. Most clients didn’t support this flag, so BC is not critical. Internally, the old flag is still mapped to the new one.
- `actors` merged into `tools` . Previously always enabled. Now part of the `tools` param logic. If no `tools` param is passed, the category remains enabled by default.
- `call-actor` enabled by default. Previously behind `preview`, it now loads automatically when no `tools` param is given. We need to improve its tool description for better UX.
- CLI still uses `--tools`, now supports tool names. No change in format, but you can now specify tool names in addition to category names.
- ⚠️ Simplified Actor schema handling is undecided. Currently no global config for this. JC recommended against it. Final decision pending – see [PR #210](https://github.com/apify/actors-mcp-server/pull/210).

**Defaults**

When no query parameters are provided, the MCP server loads the following tools by default:

 `mcp.apify.com?tools=actors,docs,apify/rag-web-browser`

- `tools` defaults to `actors` , `docs` , `apify/rag-web-browser`

This default scenario is mainly used as a playground and for Actor discovery, it should allow users to explore the Apify Store Actors and call them.

If the `tools` parameter **is specified**, only the listed tools or categories will be enabled—**no default tools will be included**.

**Recommendation ❗**

**These defaults might change in the future. If you need a stable interface, then specify the the  `tools` parameter as needed.**

**Minimal configuration**

For example, to use specific Actor—without any discovery or generic calling tools, the server can be configured like this:

```
https://mcp.apify.com?tools=apify/my-actor
```

This setup exposes only the specified Actor (`apify/my-actor`) as a tool. No other tools will be available.

**Available tools**

- `experimental`
    - `add-actor` - Add an Actor as a new tool for the user to call. Only works if the MCP client supports tool discovery - see https://modelcontextprotocol.io/clients
- `actors`
    - `search-actors` - Search for Actors in the Apify Store.
    - `fetch-actor-details` - Retrieve detailed information about a specific Actor.
    - `call-actor` - Generic call Actor that allows LLM call any Actor from the store by providing name of the Actor and input parameters without the need to add the Actor to the MCP session via the `add-actor` tool and client supporting the tools list change notification. **We need to tune the description of this tool to the users have better experience with this**.
- `docs` allow to search documentation
    - `search-apify-docs`
    - `fetch-apify-docs`
- `runs` - tools to read Actor runs and get run logs
    - `get-actor-run` - Get detailed information about a specific Actor run.
    - `get-actor-run-list` - Get a list of an Actor's runs, filterable by status.
    - `get-actor-log` - Retrieve the logs for a specific Actor run.
- `storage` - tools to read dataset and key value storage
    - `get-dataset` – Get metadata about a specific dataset.
    - `get-dataset-items` – Retrieve items from a dataset with support for filtering and pagination.
    - `get-dataset-list` – List all available datasets for the user.
    - `get-dataset-schema` - Gets a JSON schema of the dataset items.
    - `get-key-value-store` – Get metadata about a specific key-value store.
    - `get-key-value-store-keys` – List the keys within a specific key-value store.
    - `get-key-value-store-record` – Get the value associated with a specific key in a key-value store.
    - `get-key-value-store-list` – List all available key-value stores for the user.
- `chatgpt` - **FUTURE**
    - `search`
    - `fetch`
    
    

| Tool Name | Category | Description | Default |
| --- | --- | --- | --- |
| `search-actors` | actors | Search for Actors in the Apify Store. | ✅ |
| `fetch-actor-details` | actors | Retrieve detailed information about a specific Actor. | ✅ |
| `call-actor` | actors | Generic tool to call any Actor by ID and input. | ✅ |
| `add-actor` | experimental | Adds an Actor as a new tool for session. Requires client support for tool discovery. | ❌ |
| `search-apify-docs` | docs | Search the Apify documentation. | ✅ |
| `fetch-apify-docs` | docs | Fetch the full content of a documentation page. | ✅ |
| `get-actor-run` | runs | Get detailed information about a specific Actor run. | ❌ |
| `get-actor-run-list` | runs | Get a list of an Actor’s runs, filterable by status. | ❌ |
| `get-actor-log` | runs | Retrieve the logs for a specific Actor run. | ❌ |
| `get-dataset` | storage | Get metadata about a specific dataset. | ❌ |
| `get-dataset-items` | storage | Retrieve dataset items with pagination/filtering. | ❌ |
| `get-dataset-list` | storage | List all datasets for the user. | ❌ |
| `get-dataset-schema` | storage | Get the JSON schema of dataset items. | ❌ |
| `get-key-value-store` | storage | Get metadata for a key-value store. | ❌ |
| `get-key-value-store-keys` | storage | List keys in a specific key-value store. | ❌ |
| `get-key-value-store-record` | storage | Get a value by key from a key-value store. | ❌ |
| `get-key-value-store-list` | storage | List all key-value stores. | ❌ |
| [`apify/rag-web-browser`](https://apify.com/apify/rag-web-browser) |  | Preloaded Actor for browsing the web via RAG. | ✅ |

