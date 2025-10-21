/**
 * RecipeReadmeView - Display recipe README documentation
 *
 * This component dynamically imports and displays the README.mdx for a recipe.
 * Uses lazy loading to import the correct README based on recipe slug.
 */

import { Container, Paper } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy load README components based on slug
const readmeComponents: Record<string, React.LazyExoticComponent<any>> = {
    'multiturn-chat': lazy(
        () => import('../recipes/multiturn-chat/README.mdx')
    ),
    'image-captioning': lazy(
        () => import('../recipes/image-captioning/README.mdx')
    ),
}

export function Component() {
    const { slug } = useParams<{ slug: string }>()

    if (!slug || !readmeComponents[slug]) {
        return (
            <Container size='lg' py='xl'>
                <Paper p='xl' withBorder>
                    README not found for this recipe.
                </Paper>
            </Container>
        )
    }

    const ReadmeComponent = readmeComponents[slug]

    return (
        <Container size='lg' py='xl'>
            <Paper p='xl' withBorder>
                <Suspense fallback={<div>Loading...</div>}>
                    <ReadmeComponent />
                </Suspense>
            </Paper>
        </Container>
    )
}
