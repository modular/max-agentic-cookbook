/**
 * Root App component with React Router configuration
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './features/Home';
import { CookbookLayout } from './features/CookbookLayout';
import { CookbookIndex } from './features/CookbookIndex';
import { RecipePage } from './features/RecipePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cookbook" element={<CookbookLayout />}>
          <Route index element={<CookbookIndex />} />
          <Route path=":recipe" element={<RecipePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
