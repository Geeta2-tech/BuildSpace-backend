const express = require('express');
const app = express();
const routes = require('./routes');
const cors = require('cors');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors());

app.use(express.json());

// Connect to the database
const { connectToDatabase } = require('./config/db');

// Initialize database connection
connectToDatabase();

//  Routes
app.use('/api', routes);

module.exports = app;
