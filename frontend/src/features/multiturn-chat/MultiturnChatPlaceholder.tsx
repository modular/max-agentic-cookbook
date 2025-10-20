import { Container, Title, Text, Paper } from '@mantine/core'

export function Component() {
    return (
        <Container size="lg" py="xl">
            <Paper p="xl" withBorder>
                <Title order={2} mb="md">
                    Multi-turn Chat
                </Title>
                <Text c="dimmed">
                    This recipe is coming soon! It will demonstrate a streaming chat
                    interface with multi-turn conversation support.
                </Text>
            </Paper>
        </Container>
    )
}
