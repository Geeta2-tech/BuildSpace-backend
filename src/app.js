const express = require('express');
const app = express();
// const router = require('./routes');
const cors = require('cors');

app.use(cors());
app.use(express.json());
// Connect to the database
const { connectToDatabase } = require('./config/db');

// Initialize database connection
connectToDatabase();

module.exports = app;
