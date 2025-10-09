import { redirect } from 'next/navigation'
import { cookbookRoute, recipesPath } from '@/utils/constants'
import { CodeViewer } from '@/components/CodeViewer'
import path from 'path'
import fs from 'fs'

export default function RecipeCode({ params }: { params: { recipe?: string } }) {
    if (!params.recipe) return redirect(cookbookRoute())

    const recipeDir = path.join(process.cwd(), recipesPath(), params.recipe)

    // Read recipe metadata
    let description: string | undefined
    try {
        const metaPath = path.join(recipeDir, 'recipe.json')
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        description = meta?.description
    } catch {
        // No metadata available
    }

    // Read source files
    let beCode: string | undefined
    let feCode: string | undefined

    try {
        beCode = fs.readFileSync(path.join(recipeDir, 'api.ts'), 'utf8')
    } catch {
        // No backend code
    }

    try {
        feCode = fs.readFileSync(path.join(recipeDir, 'ui.tsx'), 'utf8')
    } catch {
        // No frontend code
    }

    return <CodeViewer description={description} beCode={beCode} feCode={feCode} />
}
