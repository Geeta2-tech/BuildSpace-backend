const express = require('express');
const app = express();
const routes = require('./routes');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swaggerSpec');
const cookieParser = require('cookie-parser');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());

app.use(express.json());
app.use(cookieParser());

// Connect to the database
const { connectToDatabase } = require('./config/db');

// Initialize database connection
connectToDatabase();

// Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

//  Routes
app.use('/api', routes);

module.exports = app;
