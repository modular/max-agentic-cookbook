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

/**
 * HighlightedMdxWrapper - Wraps MDX content and triggers syntax highlighting after render
 *
 * This ensures hljs.highlightAll() runs AFTER the MDX content is actually in the DOM,
 * not just when the lazy component reference loads. This fixes the initial page load issue
 * where code blocks weren't being highlighted until after a refresh.
 */
function HighlightedMdxWrapper({ Component }: { Component: React.ComponentType }) {
    useEffect(() => {
        // Trigger highlighting after this component (and its MDX children) render
        hljs.highlightAll()
    }, [])

    return <Component />
}

export function Component() {
    const { slug } = useParams<{ slug: string }>()

    const recipe = slug ? getRecipeBySlug(slug) : null
    const ReadmeComponent = slug ? getReadmeComponent(slug) : null

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
                    <HighlightedMdxWrapper Component={ReadmeComponent} />
                </Suspense>
            </Paper>
        </Container>
    )
}
