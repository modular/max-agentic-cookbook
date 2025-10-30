/**
 * Cookbook index page (/)
 */

import { Link } from 'react-router-dom'
import {
    Container,
    Title,
    Text,
    SimpleGrid,
    Card,
    Stack,
    Anchor,
    Box,
    Divider,
} from '@mantine/core'
import { isRecipeImplemented, getRecipeBySlug } from '~/recipes/registry'
import chapters from '~/lib/chapters'

export function CookbookIndex() {
    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Box>
                    <Text size="lg">
                        Welcome to Modular Agentic Cookbook, a modern fullstack app
                        built for learning agentic AI patterns with Modular MAX!
                        Explore practical recipes built with FastAPI and React that
                        demonstrate streaming technologies like SSE (Server-Sent Events)
                        and NDJSON, popular libraries like Vercel AI SDK and SWR, and
                        real-world patterns for building intelligent agents.
                    </Text>
                </Box>

                {chapters.sections.map((section) => {
                    // Get full recipe data for implemented items
                    const implementedRecipes = section.items
                        .filter((item) => isRecipeImplemented(item.slug))
                        .map((item) => getRecipeBySlug(item.slug!))
                        .filter((recipe) => recipe !== null)

                    // Skip sections with no implemented recipes
                    if (implementedRecipes.length === 0) {
                        return null
                    }

                    return (
                        <Box key={section.title}>
                            <Stack gap="lg">
                                <Box>
                                    <Title order={2} size="h3" mb="xs">
                                        {section.title}
                                    </Title>
                                    <Divider />
                                </Box>

                                <SimpleGrid
                                    cols={{ base: 1, sm: 2, lg: 3 }}
                                    spacing={{ base: 'md', sm: 'lg' }}
                                >
                                    {implementedRecipes.map((recipe) => (
                                        <Card
                                            key={recipe.slug}
                                            shadow="sm"
                                            padding="lg"
                                            radius="md"
                                            withBorder
                                            component={Link}
                                            to={`/${recipe.slug}`}
                                            style={{
                                                textDecoration: 'none',
                                                height: '100%',
                                            }}
                                        >
                                            <Stack gap="md" h="100%">
                                                <Stack gap={0}>
                                                    <Title order={3} size="h4">
                                                        {recipe.title}
                                                    </Title>
                                                    {recipe.tags && (
                                                        <Text size="sm" c="dimmed">
                                                            {recipe.tags
                                                                .sort()
                                                                .join(', ')}
                                                        </Text>
                                                    )}
                                                </Stack>
                                                <Text size="sm" style={{ flex: 1 }}>
                                                    {recipe.description}
                                                </Text>
                                                <Anchor size="sm" component="span">
                                                    View recipe →
                                                </Anchor>
                                            </Stack>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Stack>
                        </Box>
                    )
                })}
            </Stack>
        </Container>
    )
}
