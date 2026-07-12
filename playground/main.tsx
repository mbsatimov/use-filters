import { NuqsAdapter } from 'nuqs/adapters/react';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Plain-React nuqs adapter — the URL is the source of truth here too. */}
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </React.StrictMode>
);
