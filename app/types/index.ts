export type Server = {
  id: string
  name: string
  actors: Actor[]
  tools: string[] // Array of tool IDs
  prompts: Prompt[]
  enableDynamicActors?: boolean
}

export type Actor = {
  id: string
  icon: string
  title: string
  path: string
  description: string
  author: string
  authorIcon?: string
  runs: string
  rating: number
}

export type Tool = {
  id: string
  name: string
  description: string
  category: "default" | "optional"
  toolNames: Array<{
    name: string
    description: string
  }>
}

export type PromptArgument = {
  id: string
  name: string
  description: string
  required: boolean
}

export type Prompt = {
  id: string
  name: string
  description: string
  content: string
  arguments: PromptArgument[]
}
