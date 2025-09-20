import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppComplete from './AppComplete.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppComplete />
  </StrictMode>
);
