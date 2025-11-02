// src/server.ts
import http from 'http';
import app from './app.js'; // Import the configured Express app
import { setupWebSocket } from './config/constants.js';

const start = async () => {
  const port = process.env.PORT || 3000;

  // Create server from the Express app
  const server = http.createServer(app);

  try {
    server.listen(port, () => {
      // Pass the 'http' server to WebSocket setup
      setupWebSocket(server);
      console.log(`🚀 HTTP + WebSocket server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

// This allows tests to import the 'app' without starting the server
if (process.env.NODE_ENV !== 'test') {
  await start();
}
