import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectDatabase } from './config/database.js';
import logger from './config/logging.js';
import requestLogger from './middleware/requestLogger.js';
import biographyRoutes from './routes/biography.js';
import chatRoutes from './routes/chat.js';
import tracingRoutes from './routes/tracing.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// TODO: Add Authorization header middleware for multi-user authentication
// Example middleware:
// app.use((req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     // Verify token and attach user to request
//   }
//   next();
// });

// Routes
app.use('/api/biography', biographyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tracing', tracingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, { route: req.path, method: req.method });
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to database and start server
export const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.logError(error, { context: 'Server startup' });
    process.exit(1);
  }
};

export default app;
