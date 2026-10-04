import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './app/App';
import { logger } from '@/shared/utils/logger';

// Validate required environment variables
function validateEnv() {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
  const missing: (typeof required)[number][] = [];

  for (const key of required) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(message);
    throw new Error(message);
  }

  logger.info('Environment validation passed');
}

try {
  validateEnv();
} catch (error) {
  logger.error('Failed to initialize app', {
    error: error instanceof Error ? error.message : String(error),
  });
  // Prevent app from rendering if env is invalid
  throw error;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root was not found in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
