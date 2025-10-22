/**
 * RecipeReadmeView - Display recipe README documentation
 *
 * This component dynamically imports and displays the README.mdx for a recipe.
 * Uses lazy loading to import the correct README based on recipe slug.
 */

import { Container, Paper } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { Suspense } from 'react'
import { getReadmeComponent } from '../recipes/registry'

export function Component() {
    const { slug } = useParams<{ slug: string }>()

    const ReadmeComponent = slug ? getReadmeComponent(slug) : null

    if (!ReadmeComponent) {
        return (
            <Container size="lg" py="xl">
                <Paper p="xl" withBorder>
                    This recipe does not have a README.
                </Paper>
            </Container>
        )
    }

    return (
        <Container size="lg" py="xl">
            <Paper p="xl" withBorder>
                <Suspense fallback={<div>Loading...</div>}>
                    <ReadmeComponent />
                </Suspense>
            </Paper>
        </Container>
    )
}
