/**
 * Individual recipe page (/cookbook/:recipe)
 */

import { useParams } from 'react-router-dom';

export function RecipePage() {
  const { recipe } = useParams<{ recipe: string }>();

  return (
    <div style={{ padding: '2rem' }}>
      <h3>Recipe: {recipe}</h3>
      <p>This recipe page will be implemented with the actual recipe component.</p>
      <p>For now, this is a placeholder to demonstrate routing.</p>
    </div>
  );
}
