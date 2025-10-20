/**
 * Layout component for /cookbook routes
 */

import { Outlet } from 'react-router-dom';

export function CookbookLayout() {
  return (
    <div>
      <div style={{ padding: '1rem', background: '#f9f9f9' }}>
        <h2>Cookbook</h2>
      </div>
      <Outlet />
    </div>
  );
}
