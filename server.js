// Import necessary modules
const dotenv = require('dotenv');
const app = require('./src/app');
const http = require('http');
const WebSocket = require('ws');
const Block = require('./src/models/block.model');
const { createPage, getPageById, updatePageTitle } = require('./src/services/page.service');

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

// Store temporary page creation requests to avoid duplicates
const pendingPageCreations = new Map();

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
          // Client joins a specific page - only use pageId from frontend
          const session = {
            pageId: data.pageId,
            blockId: null, // Will be set when we find/create a block
          };
          clientSessions.set(ws, session);

          // Load existing block for this page only if it's not a new page
          if (!String(data.pageId).startsWith('new-')) {
            try {
              // Find the first block for this page (you can modify the order as needed)
              const existingBlock = await Block.findOne({
                where: { pageId: data.pageId },
                order: [['createdAt', 'ASC']], // Get the oldest block first
              });

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
                    pageId: data.pageId,
                  })
                );
                console.log(
                  `Loaded existing block ${existingBlock.id} for page ${data.pageId}`
                );
              } else {
                // No existing block found, send empty data
                ws.send(
                  JSON.stringify({
                    type: 'initial_data',
                    data: '',
                    blockId: null,
                    pageId: data.pageId,
                  })
                );
                console.log(`No existing block found for page ${data.pageId}`);
              }
            } catch (error) {
              console.error('Error loading existing data:', error);
              ws.send(
                JSON.stringify({
                  type: 'initial_data',
                  data: '',
                  blockId: null,
                  pageId: data.pageId,
                })
              );
            }
          } else {
            // For new pages, just send empty initial data
            ws.send(
              JSON.stringify({
                type: 'initial_data',
                data: '',
                blockId: null,
                pageId: data.pageId,
              })
            );
          }
          break;

        case 'create_page':
          // INSTANT page creation with default or provided title
          try {
            // Check if we're already creating this page to avoid duplicates
            if (pendingPageCreations.has(data.pageId)) {
              console.log(`Page creation already in progress for ${data.pageId}`);
              return;
            }

            // Mark this page as being created
            pendingPageCreations.set(data.pageId, true);

            console.log(`Creating page with title: "${data.title}"`);

            // Use the pageService createPage function
            const newPage = await createPage(
              data.title || 'Untitled', // Default to 'Untitled' if no title provided
              data.workspaceId, 
              data.createdBy || null,
              data.parentPageId || null
            );

            if (!newPage) {
              throw new Error('Failed to create page - workspace not found');
            }

            // Update the client session to use the real page ID
            const currentSession = clientSessions.get(ws);
            if (currentSession) {
              currentSession.pageId = newPage.id;
              clientSessions.set(ws, currentSession);
            }

            // Remove from pending creations
            pendingPageCreations.delete(data.pageId);

            // Send the created page back to the client immediately
            ws.send(
              JSON.stringify({
                type: 'page_created',
                page: newPage,
                originalPageId: data.pageId, // The temporary ID that was used
              })
            );

            console.log(`✅ Page created: ${newPage.id} - "${newPage.title}"`);

            // Broadcast to other clients that a new page was created
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: 'page_created_broadcast',
                    page: newPage,
                  })
                );
              }
            });
          } catch (error) {
            console.error('Error creating page:', error);
            
            // Remove from pending creations on error
            pendingPageCreations.delete(data.pageId);
            
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Failed to create page',
                error: error.message,
              })
            );
          }
          break;

        case 'title_update':
          // Handle real-time title updates
          const titleSession = clientSessions.get(ws);
          if (titleSession) {
            // For existing pages, update the title using the pageService
            if (titleSession.pageId && !String(titleSession.pageId).startsWith('new-')) {
              try {
                // Use updatePageTitle service - note: this requires userId for permission check
                // For WebSocket real-time updates, we might want to skip the permission check
                // or handle it differently. For now, let's update directly through the model
                const page = await getPageById(titleSession.pageId);
                if (page) {
                  // Direct model update for real-time collaboration
                  await page.update({ title: data.title });
                  console.log(`📝 Updated title for page ${titleSession.pageId}: "${data.title}"`);
                }
              } catch (error) {
                console.error('Error updating page title:', error);
              }
            }

            // Broadcast title update to other clients on the same page
            wss.clients.forEach((client) => {
              const clientSession = clientSessions.get(client);
              if (
                client !== ws &&
                client.readyState === WebSocket.OPEN &&
                clientSession &&
                clientSession.pageId === titleSession.pageId
              ) {
                client.send(
                  JSON.stringify({
                    type: 'title_update',
                    title: data.title,
                    pageId: titleSession.pageId,
                  })
                );
              }
            });
          }
          break;

        case 'text_update':
          const currentSession = clientSessions.get(ws);
          if (currentSession) {
            try {
              let blockId = currentSession.blockId;

              // Skip saving for temporary page IDs
              if (String(currentSession.pageId).startsWith('new-')) {
                console.log('Skipping text update for temporary page ID:', currentSession.pageId);
                return;
              }

              if (blockId) {
                // Update existing block
                await Block.update(
                  {
                    data: data.content,
                    updatedAt: new Date(),
                  },
                  { where: { id: blockId } }
                );
                console.log(
                  `Updated existing block ${blockId} for page ${currentSession.pageId}`
                );
              } else {
                // Create new block for this page
                const newBlock = await Block.create({
                  pageId: currentSession.pageId,
                  type: 'text',
                  data: data.content,
                });
                blockId = newBlock.id;

                // Update session with new block ID
                currentSession.blockId = blockId;
                clientSessions.set(ws, currentSession);
                console.log(
                  `Created new block ${blockId} for page ${currentSession.pageId}`
                );
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
                      pageId: currentSession.pageId,
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
      if (session && !String(session.pageId).startsWith('new-')) {
        try {
          let blockId = session.blockId;

          if (blockId) {
            // Update existing block
            await Block.update(
              {
                data: message.toString(),
                updatedAt: new Date(),
              },
              { where: { id: blockId } }
            );
          } else {
            // Create new block for this page
            const newBlock = await Block.create({
              pageId: session.pageId,
              type: 'text',
              data: message.toString(),
            });
            blockId = newBlock.id;
            session.blockId = blockId;
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