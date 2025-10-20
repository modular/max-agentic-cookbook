/**
 * Cookbook index page (/cookbook)
 */

import { useEffect, useState } from 'react';
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
    return <div style={{ padding: '2rem' }}>Loading recipes...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h3>All Recipes</h3>
      {recipes && recipes.recipes.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {recipes.recipes.map((recipe) => (
            <div
              key={recipe.id}
              style={{
                padding: '1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <h4>{recipe.name}</h4>
              <p>{recipe.description}</p>
              <Link to={`/cookbook/${recipe.id}`}>
                View Recipe →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>No recipes available.</p>
      )}
    </div>
  );
}
