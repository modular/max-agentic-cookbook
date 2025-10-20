/**
 * Header component with navigation
 */

import { Group, Title, Anchor, Box } from '@mantine/core';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <Box component="header" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
      <Group>
        <Title order={1} size="h2">
          <Anchor component={Link} to="/" underline="never" c="inherit">
            MAX Recipes
          </Anchor>
        </Title>
        <Anchor component={Link} to="/cookbook">
          Cookbook
        </Anchor>
      </Group>
    </Box>
  );
}
