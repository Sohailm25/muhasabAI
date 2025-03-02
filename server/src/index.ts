import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { json, urlencoded } from 'body-parser';
import { initializeDatabase } from '../db';

// Import routes
import authRoutes from './routes/auth-routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(json()); // Parse JSON request body
app.use(urlencoded({ extended: true })); // Parse URL-encoded request body

// Register routes
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'MuhasabAI API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || []
  });
});

// Start the server
const startServer = async () => {
  try {
    // Initialize database if using one
    await initializeDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Run the server
startServer(); 