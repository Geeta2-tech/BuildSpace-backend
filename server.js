// // Import necessary modules
// const dotenv = require('dotenv');
// const app = require('./src/app');
// const http = require('http');
// const WebSocket = require('ws');

// // Load environment variables from .env file
// dotenv.config();

// // Port configuration
// const PORT = process.env.PORT || 3000;

// // Create an HTTP server from your Express app
// const server = http.createServer(app);

// // Create the WebSocket server and attach it to the same HTTP server
// const wss = new WebSocket.Server({ server });

// // WebSocket connection handler
// wss.on('connection', (ws) => {
//   console.log('Client connected');
  
//   // Handle message from client
//   ws.on('message', (message) => {
//     console.log('received: %s', message);
//     // Broadcast the message to all connected clients
//     wss.clients.forEach(client => {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(message);
//       }
//     });
//   });

//   // Handle client disconnection
//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });

// // Start the HTTP server (which also includes WebSocket server)
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const dotenv = require('dotenv');
const app = require('./src/app');
const http = require('http');
const WebSocket = require('ws');
const { Block } = require('./src/models');  // Assuming you have a Block model

// Load environment variables from .env file
dotenv.config();

// Port configuration
const PORT = process.env.PORT || 3000;

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create the WebSocket server and attach it to the same HTTP server
const wss = new WebSocket.Server({ server });

// Store workspaces and their clients
const workspaces = {};

// WebSocket connection handler
wss.on('connection', (ws) => {
  let currentWorkspace = null;

  console.log('Client connected');

  // Handle message from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      // Handle user joining a workspace
      if (data.action === 'join') {
        currentWorkspace = data.workspaceId;
        if (!workspaces[currentWorkspace]) {
          workspaces[currentWorkspace] = new Set();
        }
        workspaces[currentWorkspace].add(ws);
        console.log(`Client joined workspace: ${currentWorkspace}`);
        return;
      }

      // Handle text updates in blocks
      if (data.action === 'update' && data.workspaceId && data.pageId && data.blockId && data.text) {
        const { workspaceId, pageId, blockId, text, userId } = data;
        console.log(data);

        // Save the text update to the database
        const block = await Block.findOne({ where: { id: blockId, pageId: pageId } });
        if (block) {
          block.data = text;  // Update the block text
          await block.save(); // Persist the change in the database
        }

        // Broadcast the updated text to other users in the same workspace
        const updatedMessage = {
          action: 'update',
          text,
          blockId,
          userId,
          timestamp: Date.now(),
        };

        workspaces[workspaceId].forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(updatedMessage));  // Send update to all connected users
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    if (currentWorkspace) {
      workspaces[currentWorkspace].delete(ws);
    }
  });
});

// Start the HTTP server (which also includes WebSocket server)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});