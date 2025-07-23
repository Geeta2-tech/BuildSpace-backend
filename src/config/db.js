const { Sequelize } = require('sequelize');

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql', // Default to 'mysql' if not specified
    logging: false, // Disable logging for cleaner output
  }
);

// Function to establish a database connection and sync models
const connectToDatabase = async () => {
  try {
    await sequelize.authenticate(); // Verify the connection
    await sequelize.sync({ alter: true }); // Sync models with the database, without dropping tables
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

// Export the sequelize instance and the connection function
module.exports = {
  sequelize,
  connectToDatabase,
};
