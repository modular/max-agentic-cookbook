import { RecipeMetadata } from './types'

import fs from 'fs'
import path from 'path'

export default function loadRecipes(basePath: string): RecipeMetadata[] {
    const base = path.dirname(basePath)

    const dirs = fs
        .readdirSync(base, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)

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
            description: typeof meta?.description === 'string' ? meta.description : '',
            feCode,
            beCode,
        }))

    return recipes
}
