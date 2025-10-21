// Recipe metadata organized by section
// Order in array determines numbering (1, 2, 3...)

interface RecipeBase {
    title: string
}

interface RecipePlaceholder extends RecipeBase {
    // Placeholder - not yet implemented
}

interface RecipeImplemented extends RecipeBase {
    slug: string
    description: string
}

export type Recipe = RecipePlaceholder | RecipeImplemented

export interface RecipeSection {
    [sectionName: string]: Recipe[]
}

// Single source of truth for all recipes
export const recipes: RecipeSection = {
    Foundations: [
        { title: 'Introduction' },
        {
            slug: 'multiturn-chat',
            title: 'Multi-Turn Chat',
            description:
                'Streaming chat interface with multi-turn conversation support. Messages stream token-by-token for fluid responses, with automatic scroll-follow. Uses Streamdown for markdown rendering with syntax highlighting. Seamlessly compatible with Modular MAX and other OpenAI-compatible endpoints.',
        },
        { title: 'Batch Safety Classification' },
        {
            slug: 'image-captioning',
            title: 'Streaming Image Captions',
            description:
                "Generate captions for multiple images with progressive NDJSON streaming. Upload images, customize the prompt, and watch captions appear instantly as they're generated. Includes a custom useNDJSON hook for streaming, parallel processing for speed, and performance metrics (TTFT and duration) for each image. Works with Modular MAX or any OpenAI-compatible endpoint.",
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
        { title: 'Human-in-the-Loop Systems' },
    ],
    'Context Engineering': [
        { title: 'Augmented Generation (RAG)' },
        { title: 'Dynamic Context Construction' },
        { title: 'Context Optimization Patterns' },
    ],
    'Advanced Applications': [
        { title: 'Generative UI' },
        { title: 'GitHub Repo Agent' },
        { title: 'Morning News Summary' },
        { title: 'Multi-Agent Orchestration' },
    ],
    Appendix: [
        { title: 'Observability & Debugging' },
        { title: 'Agentic Frameworks' },
        { title: 'Token Optimization' },
        { title: 'Deployment Considerations' },
    ],
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
    displayTitle: string // "1: Introduction"
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
            const displayTitle = `${number}: ${recipe.title}`

            return {
                number,
                title: recipe.title,
                displayTitle,
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

// Backwards compatibility: export recipeMetadata object for lookup
export const recipeMetadata: Record<string, RecipeImplemented> = {}
for (const section of Object.values(recipes)) {
    for (const recipe of section) {
        if (isImplemented(recipe)) {
            recipeMetadata[recipe.slug] = recipe
        }
    }
}
