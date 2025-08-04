"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { TOOLS_DATA } from "@/app/data/tools"
import type { Tool } from "@/app/types"

interface ToolSelectionProps {
  selectedToolIds: string[]
  onSelectionChange: (toolIds: string[]) => void
}

function ToolItem({
  tool,
  isSelected,
  onSelect,
}: {
  tool: Tool
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
      <Checkbox id={tool.id} checked={isSelected} onCheckedChange={() => onSelect(tool.id)} className="mt-1" />
      <div className="grid gap-1.5 leading-none flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={tool.id} className="font-medium cursor-pointer">
            {tool.name}
          </Label>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md p-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Available Tools:</h4>
                  <div className="space-y-2">
                    {tool.toolNames.map((toolName) => (
                      <div key={toolName.name} className="space-y-1">
                        <code className="font-mono text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                          {toolName.name}
                        </code>
                        <p className="text-xs text-muted-foreground leading-relaxed">{toolName.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </div>
    </div>
  )
}

export function ToolSelection({ selectedToolIds, onSelectionChange }: ToolSelectionProps) {
  const handleSelectTool = (id: string) => {
    const newSelection = selectedToolIds.includes(id)
      ? selectedToolIds.filter((toolId) => toolId !== id)
      : [...selectedToolIds, id]
    onSelectionChange(newSelection)
  }

  const defaultTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === "default"), [])
  const optionalTools = useMemo(() => TOOLS_DATA.filter((t) => t.category === "optional"), [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
        <CardDescription>Configure which tools this MCP server can use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-base font-medium mb-2">Default Tools</h3>
          <p className="text-sm text-muted-foreground mb-4">These tools are always available and cannot be disabled.</p>
          <div className="space-y-4">
            {defaultTools.map((tool) => (
              <div key={tool.id} className="flex items-start space-x-3 rounded-md border p-4 bg-muted/20">
                <Checkbox checked={true} disabled className="mt-1" />
                <div className="grid gap-1.5 leading-none flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium text-muted-foreground">{tool.name}</Label>
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-md p-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Available Tools:</h4>
                            <div className="space-y-2">
                              {tool.toolNames.map((toolName) => (
                                <div key={toolName.name} className="space-y-1">
                                  <code className="font-mono text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                                    {toolName.name}
                                  </code>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {toolName.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-base font-medium mb-2">Optional Tools</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These tools must be explicitly enabled and will be included in the server configuration.
          </p>
          <div className="space-y-4">
            {optionalTools.map((tool) => (
              <ToolItem
                key={tool.id}
                tool={tool}
                isSelected={selectedToolIds.includes(tool.id)}
                onSelect={handleSelectTool}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
