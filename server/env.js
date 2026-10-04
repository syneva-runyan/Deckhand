import { existsSync } from 'node:fs';

// Loads .env from the project root, or from server/, before other modules read process.env. Real environment variables win.
for (const rel of ['../.env', './.env']) {
  const file = new URL(rel, import.meta.url);
  if (existsSync(file) && typeof process.loadEnvFile === 'function') process.loadEnvFile(file);
}
