import type { LanguageModel } from 'ai'

export type RecipeMetadata = {
    slug: string
    title: string
    description?: string
}

export type Endpoint = {
    id: string
    baseUrl: string
    hwMake?: 'NVIDIA' | 'AMD'
    hwModel?: string
}

export type Model = {
    id: string
    name: string
    baseUrl?: string
}

export interface RecipeProps {
    endpoint: Endpoint | null
    model: Model | null
    pathname: string
}

export type ModelBuilder = (
    endpointId: string | undefined,
    modelName: string | undefined
) => Promise<LanguageModel>

export interface RecipeContext {
    baseUrl: string
    apiKey: string
    modelName: string
}
