/**
 * Individual recipe page (/cookbook/:recipe)
 */

import { Container, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';

export function RecipePage() {
  const { recipe } = useParams<{ recipe: string }>();

  return (
    <Container size="lg" py="xl">
      <Title order={3} mb="md">Recipe: {recipe}</Title>
      <Text mb="sm">This recipe page will be implemented with the actual recipe component.</Text>
      <Text c="dimmed">For now, this is a placeholder to demonstrate routing.</Text>
    </Container>
  );
}
