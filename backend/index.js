const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// ...existing code...

module.exports = app;