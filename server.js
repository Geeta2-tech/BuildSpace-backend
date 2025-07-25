// Import necessary modules
const dotenv = require('dotenv');
const app = require('./src/app');

// Load environment variables from .env file
dotenv.config();

// Port configuration
const PORT = process.env.PORT;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log the server status (can be removed in production)

  console.log(`Server is running on port ${PORT}`);
});
