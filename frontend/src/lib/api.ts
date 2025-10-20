/**
 * API client utilities for backend communication
 */

const API_BASE_URL = '/api';

export async function fetchHealthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

export async function fetchRecipes() {
  const response = await fetch(`${API_BASE_URL}/recipes`);
  if (!response.ok) {
    throw new Error('Failed to fetch recipes');
  }
  return response.json();
}
