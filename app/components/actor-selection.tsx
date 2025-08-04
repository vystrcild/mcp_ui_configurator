"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ACTORS_DATA } from "@/app/data/actors"
import type { Actor } from "@/app/types"
import { Search, X, PlusCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ActorSelectionProps {
  selectedActors: Actor[]
  onSelectionChange: (actors: Actor[]) => void
  enableDynamicActors: boolean
  onDynamicActorsChange: (enabled: boolean) => void
}

function ActorModalCard({
  actor,
  onSelect,
  isSelected,
}: {
  actor: Actor
  onSelect: (actor: Actor) => void
  isSelected: boolean
}) {
  return (
    <Card
      onClick={() => onSelect(actor)}
      className={cn(
        "cursor-pointer hover:border-primary transition-colors",
        isSelected && "border-primary ring-2 ring-primary/20",
      )}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 h-full">
        <img src={actor.icon || "/placeholder.svg"} alt={`${actor.title} icon`} className="w-10 h-10 rounded-md" />
        <p className="font-semibold text-sm leading-tight">{actor.title}</p>
      </CardContent>
    </Card>
  )
}

function SelectedActorCard({ actor, onRemove }: { actor: Actor; onRemove: (id: string) => void }) {
  return (
    <Card className="relative group bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={() => onRemove(actor.id)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove Actor</span>
      </Button>
      <CardContent className="p-3 flex items-center gap-3">
        <img src={actor.icon || "/placeholder.svg"} alt={actor.title} className="w-8 h-8 rounded-md" />
        <div>
          <p className="text-sm font-medium truncate">{actor.title}</p>
          <p className="text-xs text-muted-foreground truncate">{actor.path}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DynamicActorOption({ isEnabled, onToggle }: { isEnabled: boolean; onToggle: () => void }) {
  const dynamicActorTools = ["search-actor", "add-actor"]

  return (
    <div className="flex items-start space-x-3 rounded-md border p-4 transition-colors hover:bg-muted/50">
      <Checkbox id="dynamic-actors" checked={isEnabled} onCheckedChange={onToggle} className="mt-1" />
      <div className="grid gap-1.5 leading-none flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="dynamic-actors" className="font-medium cursor-pointer">
            Enable dynamic Actor addition
          </Label>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <ul className="text-sm space-y-1">
                  {dynamicActorTools.map((tool) => (
                    <li key={tool}>
                      • <code className="font-mono text-primary">{tool}</code>
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Allow this server to search and add new Actors on-the-fly from the Apify Store.
        </p>
      </div>
    </div>
  )
}

export function ActorSelection({
  selectedActors,
  onSelectionChange,
  enableDynamicActors,
  onDynamicActorsChange,
}: ActorSelectionProps) {
  const [open, setOpen] = useState(false)
  const [modalSelection, setModalSelection] = useState<Actor[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setModalSelection(selectedActors)
    }
    setOpen(isOpen)
  }

  const handleSave = () => {
    onSelectionChange(modalSelection)
    setOpen(false)
  }

  const handleModalSelect = (actor: Actor) => {
    setModalSelection((current) => {
      const isSelected = current.some((a) => a.id === actor.id)
      if (isSelected) {
        return current.filter((a) => a.id !== actor.id)
      }
      return [...current, actor]
    })
  }

  const handleRemoveActor = (id: string) => {
    const newSelection = selectedActors.filter((a) => a.id !== id)
    onSelectionChange(newSelection)
  }

  const filteredActors = useMemo(() => {
    if (!searchQuery) return ACTORS_DATA
    return ACTORS_DATA.filter(
      (actor) =>
        actor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actors</CardTitle>
        <CardDescription>Select the Apify Actors this MCP server can use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedActors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedActors.map((actor) => (
              <SelectedActorCard key={actor.id} actor={actor} onRemove={handleRemoveActor} />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-8">
            <p>No Actors selected.</p>
          </div>
        )}

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add or remove Actors
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Actors</DialogTitle>
              <DialogDescription>Select the Actors this MCP server can use.</DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hundreds of Actors..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 px-1">
              Can't find your desired Actor? It might not be MCP compatible.{" "}
              <a
                href="https://mcp.apify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                See more
              </a>
              .
            </p>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4">Popular Actors</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredActors.map((actor) => (
                  <ActorModalCard
                    key={actor.id}
                    actor={actor}
                    onSelect={handleModalSelect}
                    isSelected={modalSelection.some((a) => a.id === actor.id)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DynamicActorOption
          isEnabled={enableDynamicActors}
          onToggle={() => onDynamicActorsChange(!enableDynamicActors)}
        />
      </CardContent>
    </Card>
  )
}
