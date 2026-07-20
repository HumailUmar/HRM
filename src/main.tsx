import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './contexts/DataContext';
import { getSettings } from './lib/storage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider settings={getSettings()}>
      <App />
    </DataProvider>
  </StrictMode>,
);
