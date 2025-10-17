'use server'

import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { recipeMetadata } from './registry/metadata'

const recipeSourceDir = resolveRecipeSourceDir()

export async function getRecipeSource(
    id: string,
    file: 'ui' | 'api'
): Promise<string | undefined> {
    // Only resolve files for known recipes, otherwise signal "not found".
    if (!recipeMetadata[id]) return undefined
    if (file !== 'ui' && file !== 'api') return undefined

    const extension = file === 'ui' ? '.tsx' : '.ts'
    const filePath = path.join(recipeSourceDir, id, `${file}${extension}`)

    try {
        const code = await fs.promises.readFile(filePath, 'utf8')
        return code
    } catch {
        return undefined
    }
}

function resolveRecipeSourceDir(): string {
    // During local development load the sources directly from the workspace.
    const workspaceRoot = locateWorkspaceRoot(process.cwd())
    if (workspaceRoot) {
        const candidate = path.join(workspaceRoot, 'packages', 'recipes', 'src')
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }

    // Fallback for production / package consumers: use the installed package path.
    const requireFromPackage = createRequire(import.meta.url)
    const packageRoot = path.dirname(
        requireFromPackage.resolve('@modular/recipes/package.json')
    )
    return path.join(packageRoot, 'src')
}

function locateWorkspaceRoot(startDir: string): string | null {
    // Walk up the filesystem until we find pnpm-workspace.yaml, which marks the repo root.
    let current = startDir
    const { root } = path.parse(current)

    while (current && current !== root) {
        if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
            return current
        }
        current = path.dirname(current)
    }

    return null
}
