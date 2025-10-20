/**
 * Cookbook index page (/cookbook)
 */

import { useEffect, useState } from 'react';
import { Container, Title, Card, Text, Loader, SimpleGrid, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { fetchRecipes } from '../lib/api';
import type { RecipesListResponse } from '../lib/types';

export function CookbookIndex() {
  const [recipes, setRecipes] = useState<RecipesListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes()
      .then((data) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={3} mb="md">All Recipes</Title>
      {recipes && recipes.recipes.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {recipes.recipes.map((recipe) => (
            <Card key={recipe.id} shadow="sm" padding="lg" withBorder>
              <Title order={4} mb="xs">{recipe.name}</Title>
              <Text size="sm" c="dimmed" mb="md">
                {recipe.description}
              </Text>
              <Anchor component={Link} to={`/cookbook/${recipe.id}`} size="sm">
                View Recipe →
              </Anchor>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text>No recipes available.</Text>
      )}
    </Container>
  );
}
