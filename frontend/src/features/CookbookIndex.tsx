/**
 * Cookbook index page (/cookbook)
 */

import { Container, Title, Text, Paper } from '@mantine/core'

export function CookbookIndex() {
    return (
        <Container size="lg" py="xl">
            <Paper p="xl" withBorder>
                <Title order={2} mb="md">
                    Welcome to the Modular Agentic Cookbook
                </Title>
                <Text size="lg" c="dimmed">
                    Choose a recipe from the sidebar to get started.
                </Text>
            </Paper>
        </Container>
    )
}
