/**
 * Header component with navigation
 */

import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            MAX Recipes
          </Link>
        </h1>
        <Link to="/cookbook">Cookbook</Link>
      </nav>
    </header>
  );
}
