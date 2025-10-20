/**
 * Home page component
 */

import { useEffect, useState } from 'react';
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to MAX Recipes</h2>

      {health && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Backend Status</h3>
          <p><strong>Status:</strong> {health.status}</p>
          <p><strong>Message:</strong> {health.message}</p>
          <p><strong>Version:</strong> {health.version}</p>
        </div>
      )}

      {recipes && recipes.recipes.length > 0 && (
        <div>
          <h3>Available Recipes</h3>
          <ul>
            {recipes.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link to={`/cookbook/${recipe.id}`}>
                  <strong>{recipe.name}</strong>
                </Link>
                {' - '}
                {recipe.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
