"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GALLERY_DATA, GALLERY_CATEGORIES, type GalleryTemplate } from "@/app/data/gallery"
import { Users, CheckCircle, MessageSquare } from "lucide-react"

interface GalleryModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (template: GalleryTemplate) => void
}

function TemplateCard({
  template,
  onSelect,
}: { template: GalleryTemplate; onSelect: (template: GalleryTemplate) => void }) {
  return (
    <Card className="hover:border-primary/50 hover:ring-1 hover:ring-primary/50 transition-all">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img
            src={template.logo || "/placeholder.svg"}
            alt={`${template.name} logo`}
            className="w-12 h-12 rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{template.name}</h3>
              {template.prompts && template.prompts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Prompts included
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Actors Used</h4>
            {template.actors.length > 0 ? (
              <div className="flex items-center gap-2">
                {template.actors.map((actor) => (
                  <Avatar key={actor.id} className="h-6 w-6">
                    <AvatarImage src={actor.icon || "/placeholder.svg"} alt={actor.title} />
                    <AvatarFallback>{actor.title.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No specific Actors pre-selected.</p>
            )}
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <img src="/apify-logo.png" alt="Author" className="w-4 h-4" />
              <span>{template.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{template.users} users</span>
            </div>
          </div>
        </div>
        <Button className="w-full mt-4" onClick={() => onSelect(template)}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Use this Template
        </Button>
      </CardContent>
    </Card>
  )
}

export function GalleryModal({ isOpen, onClose, onTemplateSelect }: GalleryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>MCP Server Gallery</DialogTitle>
          <DialogDescription>
            Choose a pre-made template to get started quickly. You can customize it later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="Marketing" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
              {GALLERY_CATEGORIES.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 overflow-y-auto py-4">
              {GALLERY_CATEGORIES.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GALLERY_DATA.filter((item) => item.category === category).map((template) => (
                      <TemplateCard key={template.id} template={template} onSelect={onTemplateSelect} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
