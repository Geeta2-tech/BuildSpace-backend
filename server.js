// Import necessary modules
const dotenv = require('dotenv');
const app = require('./src/app');
const http = require('http');
const WebSocket = require('ws');
const Block = require('./src/models/block.model');

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
          // Client joins a specific page
          const session = {
            pageId: data.pageId,
            blockId: data.blockId,
          };
          clientSessions.set(ws, session);

          // Load existing data for this page
          try {
            let existingBlock;
            
            if (data.blockId) {
              // If specific blockId is provided, load that block
              existingBlock = await Block.findByPk(data.blockId);
            } else {
              // If no blockId, find the first block for this page (or you could get all blocks)
              existingBlock = await Block.findOne({
                where: { pageId: data.pageId },
                order: [['createdAt', 'ASC']] // Get the oldest block first
              });
            }

            if (existingBlock) {
              // Update session with the found block ID
              session.blockId = existingBlock.id;
              clientSessions.set(ws, session);
              
              // Send existing data to the client
              ws.send(
                JSON.stringify({
                  type: 'initial_data',
                  data: existingBlock.data,
                  blockId: existingBlock.id,
                })
              );
            } else {
              // No existing block found, send empty data
              ws.send(
                JSON.stringify({
                  type: 'initial_data',
                  data: '',
                  blockId: null,
                })
              );
            }
          } catch (error) {
            console.error('Error loading existing data:', error);
            ws.send(
              JSON.stringify({
                type: 'initial_data',
                data: '',
                blockId: null,
              })
            );
          }
          break;

        case 'text_update':
          const currentSession = clientSessions.get(ws);
          if (currentSession) {
            try {
              let blockId = currentSession.blockId;
              
              if (blockId) {
                // Update existing block
                await Block.update(
                  { 
                    data: data.content,
                    updatedAt: new Date()
                  },
                  { where: { id: blockId } }
                );
                console.log(`Updated existing block ${blockId} for page ${currentSession.pageId}`);
              } else {
                // Create new block only if none exists for this page
                const newBlock = await Block.create({
                  pageId: currentSession.pageId,
                  type: 'text',
                  data: data.content,
                });
                blockId = newBlock.id;
                
                // Update session with new block ID
                currentSession.blockId = blockId;
                clientSessions.set(ws, currentSession);
                console.log(`Created new block ${blockId} for page ${currentSession.pageId}`);
              }

              // Broadcast to other clients on the same page
              wss.clients.forEach((client) => {
                const clientSession = clientSessions.get(client);
                if (
                  client !== ws &&
                  client.readyState === WebSocket.OPEN &&
                  clientSession &&
                  clientSession.pageId === currentSession.pageId
                ) {
                  client.send(
                    JSON.stringify({
                      type: 'text_update',
                      content: data.content,
                      blockId: blockId,
                    })
                  );
                }
              });
            } catch (error) {
              console.error('Error saving data:', error);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Handle plain text messages (backward compatibility)
      const session = clientSessions.get(ws);
      if (session) {
        try {
          let blockId = session.blockId;
          
          if (blockId) {
            // Update existing block
            await Block.update(
              { 
                data: message.toString(),
                updatedAt: new Date()
              },
              { where: { id: blockId } }
            );
          } else {
            // Create new block
            const newBlock = await Block.create({
              pageId: session.pageId,
              type: 'text',
              data: message.toString(),
            });
            blockId = newBlock.id;
            session.blockId = blockId;
            clientSessions.set(ws, session);
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

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clientSessions.delete(ws);
  });
});

// Start the HTTP server (which also includes WebSocket server)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});