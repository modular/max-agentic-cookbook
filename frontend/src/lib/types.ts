/**
 * Shared TypeScript types and interfaces
 */

/**
 * Backend API types
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

/**
 * Recipe metadata types
 */
export interface RecipePlaceholder {
    title: string
}

export interface RecipeImplemented {
    title: string
    slug: string
    tags: string[]
    description: string
}

export type RecipeItem = RecipePlaceholder | RecipeImplemented

export interface RecipeMetadata {
    [sectionName: string]: RecipeItem[]
}

/**
 * Navigation types
 */
export interface NavItem {
    number: number
    title: string
    tags?: string[]
    slug?: string
}

export interface NavSection {
    title: string
    items: NavItem[]
}
