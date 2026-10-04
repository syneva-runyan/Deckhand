import { existsSync } from 'node:fs';

// Loads .env from the project root before other modules read process.env. Real environment variables win.
const file = new URL('../.env', import.meta.url);
if (existsSync(file) && typeof process.loadEnvFile === 'function') process.loadEnvFile(file);
