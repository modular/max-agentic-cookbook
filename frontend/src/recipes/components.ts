/**
 * Recipe component mapping - separates React components from pure data
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { RecipeProps } from '~/lib/types'

/**
 * Helper: Create a lazy-loaded component that maps named 'Component' export to default
 */
export function lazyComponentExport<T = unknown>(
    factory: () => Promise<{ Component: ComponentType<T> }>
): LazyExoticComponent<ComponentType<T>> {
    return lazy(() => factory().then((module) => ({ default: module.Component })))
}

/**
 * Map of recipe slugs to their interactive UI components
 */
export const recipeComponents: Record<
    string,
    LazyExoticComponent<ComponentType<RecipeProps>>
> = {
    'batch-text-classification': lazyComponentExport(
        () => import('./batch-text-classification/ui')
    ),
    'multiturn-chat': lazyComponentExport(() => import('./multiturn-chat/ui')),
    'image-captioning': lazyComponentExport(() => import('./image-captioning/ui')),
}

/**
 * Map of recipe slugs to their README documentation components
 */
export const readmeComponents: Record<string, LazyExoticComponent<ComponentType>> = {
    'batch-text-classification': lazy(
        () => import('./batch-text-classification/README.mdx')
    ),
    'multiturn-chat': lazy(() => import('./multiturn-chat/README.mdx')),
    'image-captioning': lazy(() => import('./image-captioning/README.mdx')),
}

/**
 * Get the interactive UI component for a recipe slug
 */
export function getRecipeComponent(
    slug: string
): LazyExoticComponent<ComponentType<RecipeProps>> | null {
    return recipeComponents[slug] || null
}

/**
 * Get the README component for a recipe slug
 */
export function getReadmeComponent(
    slug: string
): LazyExoticComponent<ComponentType> | null {
    return readmeComponents[slug] || null
}
