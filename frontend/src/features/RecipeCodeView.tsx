/**
 * RecipeCodeView - Display recipe source code
 *
 * This component shows the source code for a recipe.
 * Currently a placeholder that will be enhanced to show actual code.
 */

import { Container, Title, Text, Paper, Code } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { recipeMetadata } from '../lib/recipeMetadata';

export function Component() {
  const location = useLocation();

  // Extract recipe slug from pathname
  // e.g., "/multiturn-chat/code" -> "multiturn-chat"
  const slug = location.pathname.split('/')[1];

  // Look up recipe metadata
  const recipe = recipeMetadata[slug];
  const title = recipe?.title ?? 'Recipe';

  return (
    <Container size="lg" py="xl">
      <Paper p="xl" withBorder>
        <Title order={2} mb="md">
          {title} - Source Code
        </Title>
        <Text c="dimmed" mb="md">
          This is a placeholder for the recipe source code view.
        </Text>
        <Code block>
          {`// Recipe: ${slug}
// TODO: Display actual source code here

export function Component() {
  return <div>Recipe implementation</div>
}`}
        </Code>
      </Paper>
    </Container>
  );
}
