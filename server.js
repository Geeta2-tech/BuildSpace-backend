// Import necessary modules
const dotenv = require('dotenv');
const app = require('./src/app');
const http = require('http');
const WebSocket = require('ws');

// Load environment variables from .env file
dotenv.config();

// Port configuration
const PORT = process.env.PORT || 3000;

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create the WebSocket server and attach it to the same HTTP server
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Handle message from client
  ws.on('message', (message) => {
    console.log('received: %s', message);
    // Broadcast the message to all connected clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the HTTP server (which also includes WebSocket server)
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
