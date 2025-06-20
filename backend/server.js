require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./config/db');

// Parse JSON before any routes
app.use(express.json());

// CORS must be set before any routes
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true
}));

// Mount /api/users (which includes avatar upload)
app.use('/api/users', require('./routes/users'));

app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Import other routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/kpis', require('./routes/kpis'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/user-teams', require('./routes/userTeams'));
app.use('/api/performance', require('./routes/performance'));

app.get('/', (req, res) => {
  res.send('KPI Dashboard Backend API');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// notifications route
const notifications = require('./routes/notifications');
app.use('/api/notifications', notifications);
