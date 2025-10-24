/**
 * RecipeCodeView - Display recipe source code
 *
 * This component fetches and displays the source code for a recipe.
 * Currently shows frontend code, with structure ready for backend code.
 */

import { Container, Title, Text, Paper, Stack, Alert } from '@mantine/core'
import { useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { recipeMetadata } from '../recipes/registry'
import { fetchFrontendCode } from '../lib/api'

export function Component() {
    const location = useLocation()

    // Extract recipe slug from pathname
    // e.g., "/multiturn-chat/code" -> "multiturn-chat"
    const slug = location.pathname.split('/')[1]

    // Look up recipe metadata
    const recipe = recipeMetadata[slug]
    const title = recipe?.title ?? 'Recipe'

    // Fetch frontend code
    const {
        data: frontendCode,
        error,
        isLoading,
    } = useSWR(`/code/${slug}/frontend`, () => fetchFrontendCode(slug))

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                {/* Frontend Code Section */}
                <Paper p="xl" withBorder>
                    <Title order={3} mb="md">
                        Frontend (ui.tsx)
                    </Title>

                    {isLoading && (
                        <Text c="dimmed">Loading code...</Text>
                    )}

                    {error && (
                        <Alert color="red" title="Error loading code">
                            {error.message}
                        </Alert>
                    )}

                    {frontendCode && (
                        <pre
                            style={{
                                overflow: 'auto',
                                padding: '1rem',
                                backgroundColor: 'var(--mantine-color-gray-0)',
                                borderRadius: 'var(--mantine-radius-sm)',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                            }}
                        >
                            <code>{frontendCode}</code>
                        </pre>
                    )}
                </Paper>

                {/* Backend Code Section - Placeholder for future */}
                {/* <Paper p="xl" withBorder>
                    <Title order={3} mb="md">
                        Backend (Python)
                    </Title>
                    <Text c="dimmed">Coming soon...</Text>
                </Paper> */}
            </Stack>
        </Container>
    )
}
