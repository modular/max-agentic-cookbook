import { RecipeMetadata } from '@/lib/types'
import { recipesPath } from '@/lib/constants'
import path from 'path'
import fs from 'fs'

class RecipeStore {
    private _recipes: RecipeMetadata[] | null = null
    private _path: string

    constructor() {
        const recipePath = path.join(process.cwd(), recipesPath())
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
