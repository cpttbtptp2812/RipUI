import React from 'react';
import ReactDOM from 'react-dom/client';
import { TemplatesPage } from './TemplatesPage';
import '../index.css';

ReactDOM.createRoot(document.getElementById('templates-root')!).render(
  <React.StrictMode>
    <TemplatesPage />
  </React.StrictMode>
);
