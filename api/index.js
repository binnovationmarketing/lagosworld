require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jewelryRoutes = require('./routes/jewelry');
const cleaningRoutes = require('./routes/cleaning');
const coursesRoutes = require('./routes/courses');
const { sendEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Local dev: node api/index.js
// Vercel: exports app as serverless function handler
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Lagos Platform API running on port ${PORT}`);
  });
}

module.exports = app;
