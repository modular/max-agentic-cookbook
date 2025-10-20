import { Container, Title, Text, Paper } from '@mantine/core'

export function ImageCaptioningPlaceholder() {
    return (
        <Container size="lg" py="xl">
            <Paper p="xl" withBorder>
                <Title order={2} mb="md">Image Captioning</Title>
                <Text c="dimmed">
                    This recipe is coming soon! It will demonstrate streaming image captions
                    with progressive NDJSON streaming and performance metrics.
                </Text>
            </Paper>
        </Container>
    )
}
