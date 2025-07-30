const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3333 });

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

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
console.log('WebSocket server is running on ws://localhost:3333');
