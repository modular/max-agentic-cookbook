/**
 * RecipeLayout - Simple layout wrapper for recipe pages
 *
 * Provides a flex column layout with an optional header slot and children.
 * Matches the pattern from the monorepo's RecipeLayout component.
 */

import { Flex } from '@mantine/core';
import type { ReactNode } from 'react';

export interface RecipeLayoutProps {
  height: string;
  header?: ReactNode;
  children: ReactNode;
}

export function RecipeLayout({ height, header, children }: RecipeLayoutProps) {
  return (
    <Flex direction="column" gap="sm" style={{ overflow: 'hidden' }} h={height}>
      {header}
      {children}
    </Flex>
  );
}
