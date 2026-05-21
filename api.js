require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jewelryRoutes = require('./api/routes/jewelry');
const cleaningRoutes = require('./api/routes/cleaning');
const coursesRoutes = require('./api/routes/courses');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Attach supabase to request
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/courses', coursesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lagos Platform API running' });
});

// Serve static files
app.use(express.static('public'));
app.use(express.static('.'));

// Root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
