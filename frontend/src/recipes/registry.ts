/**
 * Recipe metadata registry - Pure data structures only, no React dependencies
 * Order in array determines numbering (1, 2, 3...)
 */

import type {
    RecipeItem,
    RecipeImplemented,
    RecipeMetadata,
    NavItem,
    NavSection,
} from '~/lib/types'

// Single source of truth for all recipe metadata
export const recipes: RecipeMetadata = {
    Foundations: [
        {
            slug: 'multiturn-chat',
            title: 'Multi-Turn Chat',
            tags: ['Vercel AI SDK', 'SSE'],
            description:
                'Streaming chat interface with multi-turn conversation support. Messages stream token-by-token with automatic scroll-follow and markdown rendering with syntax highlighting.',
        },
        {
            slug: 'text-classification',
            title: 'Text Classification',
            tags: ['JSONL', 'Batch Input'],
            description:
                'Upload JSONL files and classify text in bulk with custom prompts. Supports flexible schemas, parallel processing, and downloadable results.',
        },
        {
            slug: 'image-captioning',
            title: 'Image Captioning',
            tags: ['NDJSON', 'Multi-modal', 'Streaming'],
            description:
                'Generate captions for multiple images with progressive NDJSON streaming. Upload images, customize the prompt, and watch captions appear instantly. Includes parallel processing and performance metrics (TTFT and duration).',
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
export function isImplemented(recipe: RecipeItem): recipe is RecipeImplemented {
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
