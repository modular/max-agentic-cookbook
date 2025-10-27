// Recipe metadata organized by section
// Order in array determines numbering (1, 2, 3...)

import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { RecipeProps } from '../lib/types'

interface RecipePlaceholder {
    title: string
}

export interface RecipeImplemented {
    title: string
    slug: string
    tags: string[]
    description: string
    component?: LazyExoticComponent<ComponentType<RecipeProps>>
}

export type Recipe = RecipePlaceholder | RecipeImplemented

export interface RecipeMetadata {
    [sectionName: string]: Recipe[]
}

// Helper: Create a lazy-loaded component that maps named 'Component' export to default
export function lazyComponentExport<T = unknown>(
    factory: () => Promise<{ Component: ComponentType<T> }>
): LazyExoticComponent<ComponentType<T>> {
    return lazy(() => factory().then((module) => ({ default: module.Component })))
}

// Single source of truth for all recipes
export const recipes: RecipeMetadata = {
    Foundations: [
        { title: 'Batch Text Classification' },
        {
            slug: 'image-captioning',
            title: 'Streaming Image Captions',
            tags: ['NDJSON', 'Async'],
            description:
                'Generate captions for multiple images with progressive NDJSON streaming. Upload images, customize the prompt, and watch captions appear instantly. Includes parallel processing and performance metrics (TTFT and duration).',
            component: lazyComponentExport(() => import('./image-captioning/ui')),
        },
        {
            slug: 'multiturn-chat',
            title: 'Multi-Turn Chat',
            tags: ['Vercel AI SDK', 'SSE'],
            description:
                'Streaming chat interface with multi-turn conversation support. Messages stream token-by-token with automatic scroll-follow and markdown rendering with syntax highlighting.',
            component: lazyComponentExport(() => import('./multiturn-chat/ui')),
        },
    ],
    'Data, Tools & Reasoning': [
        { title: 'Structured Data Generation' },
        { title: 'Function Calling & Tools' },
        { title: 'The ReAct Pattern' },
        { title: 'Model Context Protocol (MCP)' },
    ],
    'Planning & Collaboration': [
        { title: 'State & Memory Management' },
        { title: 'Planning & Self-Correction' },
        { title: 'Multi-Tool Agents' },
        { title: 'Human-in-the-Loop' },
    ],
    'Context Engineering': [
        { title: 'Augmented Generation (RAG)' },
        { title: 'Coming Soon' },
        { title: 'Coming Soon' },
    ],
    'Advanced Applications': [
        { title: 'Coming Soon' },
        { title: 'Coming Soon' },
        { title: 'Coming Soon' },
        { title: 'Coming Soon' },
    ],
    Appendix: [{ title: 'Observability & Debugging' }, { title: 'Agentic Frameworks' }],
}

// Helper: Check if a recipe is implemented (has a slug)
export function isImplemented(recipe: Recipe): recipe is RecipeImplemented {
    return 'slug' in recipe
}

// Helper: Get recipe by slug
export function getRecipeBySlug(slug: string): RecipeImplemented | null {
    for (const section of Object.values(recipes)) {
        for (const recipe of section) {
            if (isImplemented(recipe) && recipe.slug === slug) {
                return recipe
            }
        }
    }
    return null
}

// Helper: Build navigation structure with auto-numbering
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

export function buildNavigation(): NavSection[] {
    const sections: NavSection[] = []
    let currentNumber = 1

    for (const [sectionName, sectionRecipes] of Object.entries(recipes)) {
        const items: NavItem[] = sectionRecipes.map((recipe) => {
            const number = currentNumber++

            return {
                number,
                title: recipe.title,
                tags: isImplemented(recipe) ? recipe.tags : undefined,
                slug: isImplemented(recipe) ? recipe.slug : undefined,
            }
        })

        sections.push({
            title: sectionName,
            items,
        })
    }

    return sections
}

// Helper: Get all implemented recipes
export function getAllImplementedRecipes(): RecipeImplemented[] {
    const implemented: RecipeImplemented[] = []
    for (const section of Object.values(recipes)) {
        for (const recipe of section) {
            if (isImplemented(recipe)) {
                implemented.push(recipe)
            }
        }
    }
    return implemented
}

// Helper: Get all recipes with interactive components
export function getAllRecipesWithComponents(): RecipeImplemented[] {
    return getAllImplementedRecipes().filter((recipe) => recipe.component !== undefined)
}

// Helper: Check if a slug corresponds to an implemented recipe
export function isRecipeImplemented(slug: string | undefined): boolean {
    if (!slug) return false
    return getRecipeBySlug(slug) !== null
}

// Backwards compatibility: export recipeMetadata object for lookup
export const recipeMetadata: Record<string, RecipeImplemented> = {}
for (const section of Object.values(recipes)) {
    for (const recipe of section) {
        if (isImplemented(recipe)) {
            recipeMetadata[recipe.slug] = recipe
        }
    }
}

// README components: Lazy-loaded MDX components for recipe documentation
export const readmeComponents: Record<
    string,
    React.LazyExoticComponent<React.ComponentType>
> = {
    'multiturn-chat': lazy(() => import('./multiturn-chat/README.mdx')),
    'image-captioning': lazy(() => import('./image-captioning/README.mdx')),
}

// Helper: Get README component for a recipe slug
export function getReadmeComponent(
    slug: string
): React.LazyExoticComponent<React.ComponentType> | null {
    return readmeComponents[slug] || null
}
