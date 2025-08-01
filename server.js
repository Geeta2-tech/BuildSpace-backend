// Import necessary modules
const dotenv = require('dotenv');
const app = require('./src/app');
const http = require('http');
const WebSocket = require('ws');
const Block = require('./src/models/block.model'); // Add this import

// Load environment variables from .env file
dotenv.config();

// Port configuration
const PORT = process.env.PORT || 3000;

// Create an HTTP server from your Express app
const server = http.createServer(app);

// Create the WebSocket server and attach it to the same HTTP server
const wss = new WebSocket.Server({ server });

// Store client sessions with their pageId and blockId
const clientSessions = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle message from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      switch (data.type) {
        case 'join':
          // Client joins a specific page/block
          clientSessions.set(ws, {
            pageId: data.pageId,
            blockId: data.blockId,
          });

          // Send current block data to the joining client
          if (data.blockId) {
            const block = await Block.findByPk(data.blockId);
            if (block) {
              ws.send(
                JSON.stringify({
                  type: 'initial_data',
                  data: block.data,
                })
              );
            }
          }
          break;

        case 'text_update':
          const session = clientSessions.get(ws);
          if (session) {
            // Update block in database
            if (session.blockId) {
              await Block.update(
                { data: data.content },
                { where: { id: session.blockId } }
              );
            } else {
              // Create new block if none exists
              const newBlock = await Block.create({
                pageId: session.pageId,
                type: 'text',
                data: data.content,
              });
              session.blockId = newBlock.id;
              clientSessions.set(ws, session);
            }

            // Broadcast to other clients on the same page
            wss.clients.forEach((client) => {
              const clientSession = clientSessions.get(client);
              if (
                client !== ws &&
                client.readyState === WebSocket.OPEN &&
                clientSession &&
                clientSession.pageId === session.pageId
              ) {
                client.send(
                  JSON.stringify({
                    type: 'text_update',
                    content: data.content,
                    blockId: session.blockId,
                  })
                );
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Handle plain text messages (backward compatibility)
      const session = clientSessions.get(ws);
      if (session) {
        try {
          if (session.blockId) {
            await Block.update(
              { data: message.toString() },
              { where: { id: session.blockId } }
            );
          }

          // Broadcast to other clients
          wss.clients.forEach((client) => {
            const clientSession = clientSessions.get(client);
            if (
              client !== ws &&
              client.readyState === WebSocket.OPEN &&
              clientSession &&
              clientSession.pageId === session.pageId
            ) {
              client.send(message);
            }
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clientSessions.delete(ws);
  });
});

// Start the HTTP server (which also includes WebSocket server)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
