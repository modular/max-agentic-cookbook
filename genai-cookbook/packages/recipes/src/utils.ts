'use server'

import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { recipeRegistry } from '../index'

const require = createRequire(import.meta.url)
const packageRoot = path.dirname(require.resolve('@modular/recipes/package.json'))
const sourceDir = path.join(packageRoot, 'src')

export async function getRecipeSource(
    id: string,
    file: 'ui' | 'api'
): Promise<string | undefined> {
    if (!recipeRegistry[id]) return undefined
    if (file !== 'ui' && file !== 'api') return undefined

    const extension = file === 'ui' ? '.tsx' : '.ts'
    const filePath = path.join(sourceDir, id, `${file}${extension}`)

    try {
        const code = fs.readFileSync(filePath, 'utf8')
        return code
    } catch {
        return undefined
    }
}
