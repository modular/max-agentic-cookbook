'use server'

import { getRecipeSource as readRecipeSource } from './src/utils'
import { recipeApiRegistry } from './src/registry/api'
import { recipeMetadata } from './src/registry/metadata'

export async function getRecipeSource(
    id: Parameters<typeof readRecipeSource>[0],
    file: Parameters<typeof readRecipeSource>[1]
) {
    return readRecipeSource(id, file)
}

export async function getRecipeMetadata(slug: string) {
    return recipeMetadata[slug]
}

export async function listRecipeMetadata() {
    return recipeMetadata
}

export async function getRecipeApiHandler(slug: string) {
    return recipeApiRegistry[slug]
}
