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
} from '@mantine/core'
import { getAllImplementedRecipes } from '../recipes/registry'
import { usePreserveQueryParams } from '../lib/hooks'

export function CookbookIndex() {
    const recipes = getAllImplementedRecipes()
    const buildPath = usePreserveQueryParams()

    return (
        <Container size="lg" py="xl">
            <Stack gap="xl">
                <Box>
                    <Text size="lg" c="dimmed">
                        Practical recipes for building AI agents with Modular MAX and
                        OpenAI-compatible endpoints.
                    </Text>
                </Box>

                <SimpleGrid
                    cols={{ base: 1, sm: 2, lg: 3 }}
                    spacing={{ base: 'md', sm: 'lg' }}
                >
                    {recipes.map((recipe) => (
                        <Card
                            key={recipe.slug}
                            shadow="sm"
                            padding="lg"
                            radius="md"
                            withBorder
                            component={Link}
                            to={buildPath(`/${recipe.slug}`)}
                            style={{ textDecoration: 'none', height: '100%' }}
                        >
                            <Stack gap="md" h="100%">
                                <Title order={3} size="h4">
                                    {recipe.title}
                                </Title>
                                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
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
        </Container>
    )
}
