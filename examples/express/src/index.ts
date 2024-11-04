import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Example POST endpoint
app.post('/echo', (req, res) => {
  res.json({
    message: 'Echo response',
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Performing graceful shutdown...');
  process.exit(0);
});
