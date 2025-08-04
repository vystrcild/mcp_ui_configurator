"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Prompt, PromptArgument } from "@/app/types"
import { Plus, Trash2, GripVertical, X } from "lucide-react"

interface PromptSelectionProps {
  prompts: Prompt[]
  onPromptsChange: (prompts: Prompt[]) => void
}

function PromptCard({ prompt, onEdit, onDelete }: { prompt: Prompt; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="relative group bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onEdit}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium mb-1">{prompt.name}</h4>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{prompt.arguments.length} arguments</span>
              {prompt.arguments.some((arg) => arg.required) && <span>• Required args</span>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PromptModal({
  prompt,
  isOpen,
  onClose,
  onSave,
}: {
  prompt: Prompt | null
  isOpen: boolean
  onClose: () => void
  onSave: (prompt: Prompt) => void
}) {
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)

  useEffect(() => {
    if (isOpen && prompt) {
      setEditingPrompt({ ...prompt })
    } else if (isOpen && !prompt) {
      // Creating new prompt
      setEditingPrompt({
        id: `prompt_${Date.now()}`,
        name: "",
        description: "",
        content: "",
        arguments: [],
      })
    }
  }, [isOpen, prompt])

  const handleSave = () => {
    if (editingPrompt && editingPrompt.name.trim()) {
      onSave(editingPrompt)
      onClose()
    }
  }

  const handleAddArgument = () => {
    if (!editingPrompt) return
    const newArg: PromptArgument = {
      id: `arg_${Date.now()}`,
      name: "",
      description: "",
      required: false,
    }
    setEditingPrompt({
      ...editingPrompt,
      arguments: [...editingPrompt.arguments, newArg],
    })
  }

  const handleUpdateArgument = (argId: string, updates: Partial<PromptArgument>) => {
    if (!editingPrompt) return
    setEditingPrompt({
      ...editingPrompt,
      arguments: editingPrompt.arguments.map((arg) => (arg.id === argId ? { ...arg, ...updates } : arg)),
    })
  }

  const handleDeleteArgument = (argId: string) => {
    if (!editingPrompt) return
    setEditingPrompt({
      ...editingPrompt,
      arguments: editingPrompt.arguments.filter((arg) => arg.id !== argId),
    })
  }

  if (!editingPrompt) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{prompt ? "Edit Prompt" : "Create New Prompt"}</DialogTitle>
          <DialogDescription>Define a reusable prompt template with arguments for your MCP server.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Name *</Label>
              <Input
                id="prompt-name"
                placeholder="e.g., analyze-leads"
                value={editingPrompt.name}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-description">Description</Label>
              <Input
                id="prompt-description"
                placeholder="Brief description of what this prompt does"
                value={editingPrompt.description}
                onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-content">Template Content *</Label>
            <Textarea
              id="prompt-content"
              placeholder="Your prompt template content. Use {{argName}} for arguments."
              value={editingPrompt.content}
              onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
              className="w-full min-h-[150px] text-sm font-mono"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Arguments</h4>
              <Button variant="outline" size="sm" onClick={handleAddArgument}>
                <Plus className="h-4 w-4 mr-2" />
                Add Argument
              </Button>
            </div>
            {editingPrompt.arguments.length > 0 ? (
              <div className="space-y-3">
                {editingPrompt.arguments.map((arg) => (
                  <div key={arg.id} className="flex items-start gap-2 p-3 border rounded-md bg-muted/50">
                    <GripVertical className="h-5 w-5 mt-7 text-muted-foreground/50" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`arg-name-${arg.id}`}>Name</Label>
                        <Input
                          id={`arg-name-${arg.id}`}
                          placeholder="argumentName"
                          value={arg.name}
                          onChange={(e) => handleUpdateArgument(arg.id, { name: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`arg-desc-${arg.id}`}>Description</Label>
                        <Input
                          id={`arg-desc-${arg.id}`}
                          placeholder="Description of this argument"
                          value={arg.description}
                          onChange={(e) => handleUpdateArgument(arg.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-between h-full ml-4 pt-1">
                      <Label htmlFor={`arg-req-${arg.id}`} className="text-xs text-muted-foreground mb-2">
                        Required
                      </Label>
                      <Checkbox
                        id={`arg-req-${arg.id}`}
                        checked={arg.required}
                        onCheckedChange={(checked) => handleUpdateArgument(arg.id, { required: !!checked })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mt-6"
                      onClick={() => handleDeleteArgument(arg.id)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                No arguments defined. Click "Add Argument" to create dynamic parameters for your prompt.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!editingPrompt.name.trim() || !editingPrompt.content.trim()}>
            {prompt ? "Save Changes" : "Create Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PromptSelection({ prompts, onPromptsChange }: PromptSelectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)

  const handleCreatePrompt = () => {
    setEditingPrompt(null)
    setModalOpen(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setModalOpen(true)
  }

  const handleDeletePrompt = (id: string) => {
    onPromptsChange(prompts.filter((p) => p.id !== id))
  }

  const handleSavePrompt = (prompt: Prompt) => {
    if (editingPrompt) {
      // Editing existing prompt
      onPromptsChange(prompts.map((p) => (p.id === prompt.id ? prompt : p)))
    } else {
      // Creating new prompt
      onPromptsChange([...prompts, prompt])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompts</CardTitle>
        <CardDescription>Define reusable prompt templates and their arguments.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => handleEditPrompt(prompt)}
                onDelete={() => handleDeletePrompt(prompt.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-8">
            <p>No prompts created yet.</p>
          </div>
        )}

        <Button variant="outline" className="w-full bg-transparent" onClick={handleCreatePrompt}>
          <Plus className="mr-2 h-4 w-4" />
          Create new prompt
        </Button>

        <PromptModal
          prompt={editingPrompt}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSavePrompt}
        />
      </CardContent>
    </Card>
  )
}
