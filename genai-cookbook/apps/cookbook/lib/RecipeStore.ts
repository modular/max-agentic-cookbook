import { RecipeMetadata, RecipeProps, RecipeContext } from '@modular/recipe-sdk/types'
import { recipesPath } from '@/lib/constants'
import path from 'path'
import fs from 'fs'
import type { ComponentType } from 'react'

type RecipeHandler = (req: Request, context: RecipeContext) => Response | Promise<Response>

class RecipeStore {
    private recipes: RecipeMetadata[] | null = null
    private path: string
    private componentCache = new Map<string, ComponentType<RecipeProps>>()
    private handlerCache = new Map<string, RecipeHandler>()
    private recipesLoaded = false

    constructor() {
        const recipePath = path.join(process.cwd(), recipesPath())
        this.path = recipePath
    }

    recipePath(): string {
        return this.path
    }

    getAll(): RecipeMetadata[] | null {
        if (!this.recipesLoaded) {
            this.recipes = this.loadRecipes(this.path)
            this.recipesLoaded = true
        }
        return this.recipes
    }

    async getHandler(slug: string | undefined): Promise<RecipeHandler | null> {
        return await this.getRecipeContent('api', this.handlerCache, slug)
    }

    async getComponent(slug: string | undefined): Promise<ComponentType<RecipeProps> | null> {
        return await this.getRecipeContent('ui', this.componentCache, slug)
    }

    async getRecipeContent<T>(
        type: 'ui' | 'api',
        cache: Map<string, T>,
        slug: string | undefined
    ): Promise<T | null> {
        if (!slug) return null

        const cached = cache.get(slug)
        if (cached) return cached

        try {
            // Lazy-load the recipe registry to avoid loading UI components during instrumentation
            const { recipeRegistry } = await import('@modular/recipes')
            const recipe = recipeRegistry[slug]
            if (!recipe) {
                console.warn(`Recipe not found in registry: ${slug}`)
                return null
            }

            const content = recipe[type] as T
            if (content) {
                cache.set(slug, content)
            }

            return content
        } catch (error) {
            console.warn(`Failed loading recipe ${type} for slug: ${slug}`, error)
            return null
        }
    }

    private loadRecipes(base: string): RecipeMetadata[] {
        console.log('Loading recipes from', base)

        const dirs = fs
            .readdirSync(base, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)

        console.log('Found recipes in', dirs)

        const data = dirs.map((d) => {
            try {
                const jsonPath = path.join(base, d, 'recipe.json')
                const fePath = path.join(base, d, 'ui.tsx')
                const bePath = path.join(base, d, 'api.ts')
                if (!fs.statSync(jsonPath).isFile()) return null
                const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

                let feCode
                if (fs.statSync(fePath).isFile()) {
                    feCode = fs.readFileSync(fePath, 'utf8')
                }

                let beCode
                if (fs.statSync(bePath).isFile()) {
                    beCode = fs.readFileSync(bePath, 'utf8')
                }

                return { slug: d, meta, feCode, beCode }
            } catch {
                return null
            }
        })

        const recipes: RecipeMetadata[] = data
            .filter((r) => r !== null)
            .map(({ slug, meta, feCode, beCode }) => ({
                slug,
                title: typeof meta?.title === 'string' ? meta.title : '',
                description:
                    typeof meta?.description === 'string' ? meta.description : '',
                feCode,
                beCode,
            }))

        console.log(`Built metadata for ${recipes.length} recipes`)
        return recipes
    }
}

// Add store to the NodeJS global type
declare global {
    // eslint-disable-next-line no-var
    var recipeStore: RecipeStore | undefined
}

// Prevent multiple instances of store in development
const recipeStore = globalThis.recipeStore || new RecipeStore()
if (process.env.NODE_ENV !== 'production') {
    globalThis.recipeStore = recipeStore
}

export default recipeStore
