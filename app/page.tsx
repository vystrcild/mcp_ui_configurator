"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Plus,
  ServerIcon,
  Settings,
  LinkIcon,
  Trash2,
  Pencil,
  ExternalLink,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ActorSelection } from "@/app/components/actor-selection"
import { ToolSelection } from "@/app/components/tool-selection"
import { PromptSelection } from "@/app/components/prompt-selection"
import { GalleryModal } from "@/app/components/gallery-modal"
import type { Server, Actor, Prompt } from "@/app/types"
import type { GalleryTemplate } from "@/app/data/gallery"
import { ACTORS_DATA } from "@/app/data/actors"
import { PROMPTS_DATA } from "@/app/data/prompts"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// Mock usage data
const MOCK_USAGE_DATA = [
  {
    id: "session_1",
    date: "2024-01-15",
    time: "14:30",
    client: "Claude Desktop",
    toolsTriggered: [
      { name: "search-actors", count: 2 },
      { name: "get-actor-run-list", count: 3 },
      { name: "get-dataset-items", count: 1 },
    ],
  },
  {
    id: "session_2",
    date: "2024-01-15",
    time: "09:15",
    client: "Claude Desktop",
    toolsTriggered: [
      { name: "get-actor-run", count: 5 },
      { name: "search-apify-docs", count: 2 },
    ],
  },
  {
    id: "session_3",
    date: "2024-01-14",
    time: "16:45",
    client: "Claude Desktop",
    toolsTriggered: [
      { name: "get-dataset", count: 2 },
      { name: "get-key-value-store-records", count: 3 },
      { name: "get-actor-log", count: 1 },
    ],
  },
  {
    id: "session_4",
    date: "2024-01-14",
    time: "11:20",
    client: "Claude Desktop",
    toolsTriggered: [{ name: "get-actor-details", count: 1 }],
  },
]

const INITIAL_SERVERS: Server[] = [
  {
    id: "srv_1",
    name: "Lead Gen",
    actors: [ACTORS_DATA[0], ACTORS_DATA[4]],
    tools: ["tool_actor_runs"], // Only optional tools are stored
    prompts: [PROMPTS_DATA[0]],
    enableDynamicActors: true,
  },
  {
    id: "srv_2",
    name: "Search Influencers",
    actors: [ACTORS_DATA[2], ACTORS_DATA[5]],
    tools: ["tool_actor_runs"],
    prompts: [PROMPTS_DATA[1]],
    enableDynamicActors: true,
  },
  {
    id: "srv_3",
    name: "Good Restaurants in Area",
    actors: [ACTORS_DATA[3]],
    tools: ["tool_actor_runs"],
    prompts: [PROMPTS_DATA[2]],
    enableDynamicActors: true,
  },
]

export default function McpDashboard() {
  const [servers, setServers] = useState<Server[]>(INITIAL_SERVERS)
  const [selectedServerId, setSelectedServerId] = useState<string | null>("srv_1")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("configuration")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [useToken, setUseToken] = useState(false)

  const selectedServer = useMemo(() => servers.find((s) => s.id === selectedServerId), [servers, selectedServerId])

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  useEffect(() => {
    setActiveTab("configuration")
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [selectedServerId])

  const updateServerConfig = (serverId: string, newConfig: Partial<Server>) => {
    setServers((currentServers) =>
      currentServers.map((server) => (server.id === serverId ? { ...server, ...newConfig } : server)),
    )
  }

  const handleActorsChange = (newActors: Actor[]) => {
    if (selectedServerId) {
      updateServerConfig(selectedServerId, { actors: newActors })
    }
  }

  const handleToolsChange = (newToolIds: string[]) => {
    if (selectedServerId) {
      updateServerConfig(selectedServerId, { tools: newToolIds })
    }
  }

  const handlePromptsChange = (newPrompts: Prompt[]) => {
    if (selectedServerId) {
      updateServerConfig(selectedServerId, { prompts: newPrompts })
    }
  }

  const handleDynamicActorsChange = (enabled: boolean) => {
    if (selectedServerId) {
      updateServerConfig(selectedServerId, { enableDynamicActors: enabled })
    }
  }

  const handleCreateServer = () => {
    const newId = `srv_${Date.now()}`
    const newServer: Server = {
      id: newId,
      name: "Untitled Server",
      actors: [],
      tools: [], // Start with no optional tools
      prompts: [],
      enableDynamicActors: true,
    }
    setServers((prev) => [...prev, newServer])
    setSelectedServerId(newId)
    handleStartRename(newServer)
  }

  const handleCreateFromTemplate = (template: GalleryTemplate) => {
    const newId = `srv_${Date.now()}`
    const newServer: Server = {
      id: newId,
      name: template.name,
      actors: template.actors,
      tools: template.defaultTools,
      prompts: template.prompts || [],
      enableDynamicActors: true,
    }
    setServers((prev) => [...prev, newServer])
    setSelectedServerId(newId)
    setIsGalleryOpen(false)
  }

  const handleDeleteServer = (id: string) => {
    setServers((prev) => {
      const newServers = prev.filter((s) => s.id !== id)
      if (selectedServerId === id) {
        setSelectedServerId(newServers.length > 0 ? newServers[0].id : null)
      }
      return newServers
    })
  }

  const handleStartRename = (server: Server) => {
    setRenamingId(server.id)
    setRenameValue(server.name)
  }

  const handleFinishRename = () => {
    if (!renamingId) return
    setServers((prev) => prev.map((s) => (s.id === renamingId ? { ...s, name: renameValue } : s)))
    setRenamingId(null)
  }

  const generateServerConfig = (server: Server) => {
    const serverName = `Apify-${server.name.toLowerCase().replace(/\s+/g, "-")}`

    // Map tool IDs to the expected values (same as URL)
    const toolMapping: Record<string, string> = {
      tool_apify_docs: "docs",
      tool_actor_runs: "runs",
      tool_apify_storage: "storage",
    }

    const mappedTools = server.tools
      .map((toolId) => toolMapping[toolId])
      .filter((tool, index, arr) => tool && arr.indexOf(tool) === index) // Remove duplicates and undefined

    const toolsArg = mappedTools.length > 0 ? `--tools=${mappedTools.join(",")}` : ""
    const actorsArg = server.actors.length > 0 ? `--actors=${server.actors.map((a) => a.path).join(",")}` : ""

    // Build args array with -y first, then package name, then other args
    const additionalArgs = [actorsArg, toolsArg].filter((arg) => arg !== "")
    const args = ["-y", "@apify/actors-mcp-server", ...additionalArgs]

    const config = {
      mcpServers: {
        [serverName]: {
          command: "npx",
          args: args,
          ...(useToken && {
            env: {
              APIFY_TOKEN: "YOUR_APIFY_TOKEN",
            },
          }),
        },
      },
    }

    return JSON.stringify(config, null, 2)
  }

  const generateMcpUrl = (server: Server) => {
    const baseUrl = "https://mcp.apify.com/"
    const params = new URLSearchParams()

    // Only add enableAddingActors parameter if it's set to false (since true is default)
    if (server.enableDynamicActors === false) {
      params.append("enableAddingActors", "false")
    }

    // Add actors parameter
    if (server.actors.length > 0) {
      const actorPaths = server.actors.map((actor) => actor.path).join(",")
      params.append("actors", actorPaths)
    }

    // Add tools parameter - map tool IDs to the expected values
    if (server.tools.length > 0) {
      const toolMapping: Record<string, string> = {
        tool_apify_docs: "docs",
        tool_actor_runs: "runs",
        tool_apify_storage: "storage",
      }

      const mappedTools = server.tools
        .map((toolId) => toolMapping[toolId])
        .filter((tool, index, arr) => tool && arr.indexOf(tool) === index) // Remove duplicates and undefined

      if (mappedTools.length > 0) {
        params.append("tools", mappedTools.join(","))
      }
    }

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <aside className="w-[280px] flex-shrink-0 border-r bg-muted/30 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 px-2 pt-2">
            <img src="https://apify.com/img/apify-logo/logomark-32x32.svg" alt="Apify Logo" className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Apify MCP</h2>
          </div>

          <div className="p-2">
            <Button
              size="sm"
              onClick={handleCreateServer}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create new MCP server
            </Button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {servers.map((server) => (
              <div key={server.id} className="group relative flex items-center rounded-md">
                {renamingId === server.id ? (
                  <Input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => e.key === "Enter" && handleFinishRename()}
                    className="h-9 flex-1"
                  />
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start items-center gap-2 relative",
                        selectedServerId === server.id &&
                          "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border border-primary/20",
                      )}
                      onClick={() => setSelectedServerId(server.id)}
                    >
                      {selectedServerId === server.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}
                      <ServerIcon
                        className={cn(
                          "h-4 w-4 ml-1",
                          selectedServerId === server.id ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="flex-1 text-left truncate font-medium">{server.name}</span>
                    </Button>
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartRename(server)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteServer(server.id)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>

          <div className="pt-4 mt-auto border-t border-border/60">
            <Button
              variant="outline"
              onClick={() => setIsGalleryOpen(true)}
              className="w-full justify-start bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:from-primary/10 hover:to-primary/15 hover:border-primary/30 text-primary hover:text-primary"
            >
              <ExternalLink className="h-4 w-4 mr-3 flex-shrink-0" />
              <span className="flex flex-col text-left">
                <span className="font-medium">Browse Gallery</span>
                <span className="text-xs text-primary/70">Pre-made templates & examples</span>
              </span>
            </Button>
          </div>
        </aside>
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {selectedServer ? (
            <>
              <div className="flex-shrink-0 bg-background/50 backdrop-blur-sm border-b px-6 py-4">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-2xl font-bold mb-4">{selectedServer.name}</h1>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="configuration">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuration
                      </TabsTrigger>
                      <TabsTrigger value="connections">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Connections
                      </TabsTrigger>
                      <TabsTrigger value="usage">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Usage
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="configuration" className="mt-0 space-y-6">
                      <ActorSelection
                        selectedActors={selectedServer.actors}
                        onSelectionChange={handleActorsChange}
                        enableDynamicActors={selectedServer.enableDynamicActors ?? true}
                        onDynamicActorsChange={handleDynamicActorsChange}
                      />
                      <ToolSelection selectedToolIds={selectedServer.tools} onSelectionChange={handleToolsChange} />
                      <PromptSelection prompts={selectedServer.prompts} onPromptsChange={handlePromptsChange} />
                    </TabsContent>
                    <TabsContent value="connections" className="mt-0 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>MCP Server URL</CardTitle>
                          <CardDescription>
                            Your unique MCP server endpoint for external integrations and API access.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Server Endpoint</h4>
                              <div className="relative">
                                <div className="bg-muted p-3 rounded-md text-sm font-mono border">
                                  {generateMcpUrl(selectedServer)}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-2 right-2 bg-transparent"
                                  onClick={() => navigator.clipboard.writeText(generateMcpUrl(selectedServer))}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                This URL can be used to access your MCP server remotely or integrate it with external
                                services.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>MCP Server JSON Configuration</CardTitle>
                          <CardDescription>
                            Add this configuration to your MCP client (Claude Desktop, etc.) to use this server.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Configuration JSON</h4>
                              <div className="relative">
                                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                  <code>{generateServerConfig(selectedServer)}</code>
                                </pre>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-2 right-2 bg-transparent"
                                  onClick={() => navigator.clipboard.writeText(generateServerConfig(selectedServer))}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox id="use-token" checked={useToken} onCheckedChange={setUseToken} />
                              <Label htmlFor="use-token" className="text-sm cursor-pointer">
                                Use token authentication (includes APIFY_TOKEN environment variable)
                              </Label>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              <p className="mb-2">
                                <strong>Authentication:</strong> By default, OAuth authentication is used.{" "}
                                {useToken ? (
                                  <>
                                    Replace <code className="bg-muted px-1 rounded">YOUR_APIFY_TOKEN</code> with your
                                    actual Apify API token.
                                  </>
                                ) : (
                                  "No token configuration needed - OAuth will be used automatically."
                                )}
                              </p>
                              <p>
                                For detailed setup instructions, visit the{" "}
                                <a
                                  href="https://mcp.apify.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Apify MCP documentation
                                </a>
                                .
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="usage" className="mt-0 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Usage Dashboard</CardTitle>
                          <CardDescription>Track tool usage and sessions for your MCP server.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {MOCK_USAGE_DATA.map((session) => (
                              <div key={session.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div>
                                      <p className="font-medium text-sm">{session.date}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {session.time} • {session.client}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {session.toolsTriggered.reduce((sum, tool) => sum + tool.count, 0)} calls
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-medium text-muted-foreground uppercase">
                                    Tools Triggered
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {session.toolsTriggered.map((tool, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs"
                                      >
                                        <span className="font-mono">{tool.name}</span>
                                        <Badge variant="outline" className="text-xs h-4 px-1">
                                          {tool.count}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No Server Selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a server from the list or create a new one to get started.
                </p>
                <div className="mt-6">
                  <Button onClick={handleCreateServer}>
                    <Plus className="mr-2 h-4 w-4" /> Create Server
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onTemplateSelect={handleCreateFromTemplate}
      />
    </>
  )
}
