/**
 * Shared TypeScript types and interfaces
 */

export interface Recipe {
  id: string;
  name: string;
  description: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  version: string;
}

export interface RecipesListResponse {
  recipes: Recipe[];
}
