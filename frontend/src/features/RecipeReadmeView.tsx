/**
 * RecipeReadmeView - Display recipe README documentation
 *
 * This component dynamically imports and displays the README.mdx for a recipe.
 * Uses lazy loading to import the correct README based on recipe slug.
 */

import { Container, Paper, Text } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import {
    getReadmeComponent,
    getRecipeBySlug,
    type RecipeImplemented,
} from '../recipes/registry'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'

// Register languages for syntax highlighting
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)

function RecipeDescription({ recipe }: { recipe: RecipeImplemented | null }) {
    if (!recipe?.description) return null

    return (
        <Text size="lg" mb="xl">
            {recipe.description}
        </Text>
    )
}

export function Component() {
    const { slug } = useParams<{ slug: string }>()

    const recipe = slug ? getRecipeBySlug(slug) : null
    const ReadmeComponent = slug ? getReadmeComponent(slug) : null

    // Highlight code blocks after MDX content loads
    useEffect(() => {
        hljs.highlightAll()
    }, [ReadmeComponent])

    if (!ReadmeComponent) {
        return (
            <Container size="lg" py="xl">
                <RecipeDescription recipe={recipe} />
                <Paper>
                    <Text c="dimmed">This recipe does not have a README.</Text>
                </Paper>
            </Container>
        )
    }

    return (
        <Container size="lg" py="xl">
            <RecipeDescription recipe={recipe} />
            <Paper>
                <Suspense fallback={<div>Loading...</div>}>
                    <ReadmeComponent />
                </Suspense>
            </Paper>
        </Container>
    )
}
