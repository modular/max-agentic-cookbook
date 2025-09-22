import { RecipeMetadata } from '@/lib/types'
import path from 'path'
import fs from 'fs'

class RecipeStore {
    private _recipes: RecipeMetadata[] | null = null
    private _path: string

    constructor() {
        const recipePath = path.join(process.cwd(), 'app', 'recipes')
        this._path = recipePath
        this._recipes = this.loadRecipes(recipePath)
    }

    getAll(): RecipeMetadata[] | null {
        return this._recipes
    }

    recipePath(): string {
        return this._path
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
                const fePath = path.join(base, d, 'page.tsx')
                const bePath = path.join(base, d, 'api', 'route.ts')
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

        return recipes
    }
}

// Persist store across hot-reload when running in dev mode
declare global {
    // eslint-disable-next-line no-var
    var __recipeStore__: RecipeStore | undefined
}

const recipeStore: RecipeStore =
    globalThis.__recipeStore__ ?? (globalThis.__recipeStore__ = new RecipeStore())

export default recipeStore
