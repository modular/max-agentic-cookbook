/**
 * Shared TypeScript types and interfaces
 */

export interface Recipe {
    id: string
    name: string
    description: string
}

export interface HealthCheckResponse {
    status: string
    message: string
    version: string
}

export interface RecipesListResponse {
    recipes: Recipe[]
}

/**
 * Endpoint configuration for connecting to LLM servers
 */
export interface Endpoint {
    id: string
    baseUrl: string
    hwMake?: 'NVIDIA' | 'AMD'
    hwModel?: string
}

/**
 * Model information from an LLM server
 */
export interface Model {
    id: string
    name: string
}

/**
 * Props passed to all recipe components
 */
export interface RecipeProps {
    endpoint: Endpoint | null
    model: Model | null
    pathname: string
}
