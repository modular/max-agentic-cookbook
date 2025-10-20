/**
 * Home page component
 */

import { useEffect, useState } from 'react';
import { Container, Title, Paper, Text, List, Loader, Alert, Anchor, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import { fetchHealthCheck, fetchRecipes } from '../lib/api';
import type { HealthCheckResponse, RecipesListResponse } from '../lib/types';

export function Home() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [recipes, setRecipes] = useState<RecipesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchHealthCheck(), fetchRecipes()])
      .then(([healthData, recipesData]) => {
        setHealth(healthData);
        setRecipes(recipesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Container mt="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container mt="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={2}>Welcome to MAX Recipes</Title>

        {health && (
          <Paper p="md" withBorder>
            <Title order={3} size="h4" mb="sm">Backend Status</Title>
            <Text><strong>Status:</strong> {health.status}</Text>
            <Text><strong>Message:</strong> {health.message}</Text>
            <Text><strong>Version:</strong> {health.version}</Text>
          </Paper>
        )}

        {recipes && recipes.recipes.length > 0 && (
          <div>
            <Title order={3} size="h4" mb="sm">Available Recipes</Title>
            <List>
              {recipes.recipes.map((recipe) => (
                <List.Item key={recipe.id}>
                  <Anchor component={Link} to={`/cookbook/${recipe.id}`} fw={700}>
                    {recipe.name}
                  </Anchor>
                  {' - '}
                  {recipe.description}
                </List.Item>
              ))}
            </List>
          </div>
        )}
      </Stack>
    </Container>
  );
}
