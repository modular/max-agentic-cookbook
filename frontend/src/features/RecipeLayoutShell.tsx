/**
 * RecipeLayoutShell - Nested layout for recipe pages
 *
 * This component wraps all recipe pages and provides:
 * - Toolbar with recipe title, CodeToggle, and endpoint/model selectors
 * - RecipeLayout wrapper with proper height
 * - Outlet for nested recipe routes
 *
 * Uses React Router v7 nested routes pattern:
 * <Route element={<RecipeLayoutShell />}>
 *   <Route path="multiturn-chat" element={...} />
 *   <Route path="image-captioning" element={...} />
 * </Route>
 */

import { Outlet, useLocation } from 'react-router-dom';
import { RecipeLayout } from '../components/RecipeLayout';
import { Toolbar } from '../components/Toolbar';
import { appShellContentHeight } from '../lib/theme';
import { recipeMetadata } from '../lib/recipeMetadata';

export function RecipeLayoutShell() {
  const location = useLocation();

  // Extract recipe slug from pathname
  // e.g., "/multiturn-chat" -> "multiturn-chat"
  // e.g., "/multiturn-chat/code" -> "multiturn-chat"
  const slug = location.pathname.split('/')[1].replace(/\/code$/, '');

  // Look up recipe metadata
  const recipe = recipeMetadata[slug];
  const title = recipe?.title ?? '';

  return (
    <RecipeLayout height={appShellContentHeight} header={<Toolbar title={title} />}>
      <Outlet />
    </RecipeLayout>
  );
}
