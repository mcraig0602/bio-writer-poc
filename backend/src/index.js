import dotenv from 'dotenv';

// Ensure .env is loaded before any other modules read process.env (important for ESM)
dotenv.config();

const { startServer } = await import('./server.js');

await startServer();
