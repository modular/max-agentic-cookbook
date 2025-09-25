import { RecipeMetadata } from '@/lib/types'
import { recipesPath } from '@/lib/constants'
import path from 'path'
import fs from 'fs'
import type { ComponentType } from 'react'

class RecipeStore {
    private _recipes: RecipeMetadata[] | null = null
    private _path: string
    private componentCache = new Map<string, ComponentType>()

    constructor() {
        const recipePath = path.join(process.cwd(), recipesPath())
        this._path = recipePath
        this._recipes = this.loadRecipes(recipePath)
    }

    recipePath(): string {
        return this._path
    }

    getAll(): RecipeMetadata[] | null {
        return this._recipes
    }

    async getComponent(slug: string | undefined): Promise<ComponentType | null> {
        if (!slug) return null

        const cached = this.componentCache.get(slug)
        if (cached) return cached

        try {
            const mod = (await import(`@/recipes/${slug}/ui`)) as {
                default?: ComponentType
            }
            const Component = mod.default ?? null
            if (Component) {
                this.componentCache.set(slug, Component)
            }
            return Component
        } catch (error) {
            console.warn(`Failed to load recipe component for slug: ${slug}`, error)
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

        // console.log('Loaded recipe data:', data)

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

// Add endpointStore to the NodeJS global type
declare global {
    // eslint-disable-next-line no-var
    var recipeStore: RecipeStore | undefined
}

// Prevent multiple instances of EndpointStore in development
const recipeStore = globalThis.recipeStore || new RecipeStore()
if (process.env.NODE_ENV !== 'production') {
    globalThis.recipeStore = recipeStore
}

export default recipeStore
