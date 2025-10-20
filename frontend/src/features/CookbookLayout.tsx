/**
 * Layout component for /cookbook routes
 */

import { Box, Title } from '@mantine/core';
import { Outlet } from 'react-router-dom';

export function CookbookLayout() {
  return (
    <Box>
      <Box p="md" bg="gray.0">
        <Title order={2}>Cookbook</Title>
      </Box>
      <Outlet />
    </Box>
  );
}
