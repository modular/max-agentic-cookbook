/**
 * Root App component with React Router configuration
 */

import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './lib/theme';
import { CookbookShell } from './features/CookbookShell';
import { CookbookIndex } from './features/CookbookIndex';
import { MultiturnChatPlaceholder } from './features/multiturn-chat/MultiturnChatPlaceholder';
import { ImageCaptioningPlaceholder } from './features/image-captioning/ImageCaptioningPlaceholder';
import './App.css';

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CookbookShell />}>
            <Route index element={<CookbookIndex />} />
            <Route path="multiturn-chat" element={<MultiturnChatPlaceholder />} />
            <Route path="image-captioning" element={<ImageCaptioningPlaceholder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
