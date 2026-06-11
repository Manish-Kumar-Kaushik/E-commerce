import './src/config/env.js';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';
import { ensureDefaultAdminExists } from './src/services/adminBootstrapService.js';

const PORT = process.env.PORT || 5001;
let server;

const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down server gracefully.`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

const startServer = async () => {
  const databaseConnected = await connectDB();

  if (!databaseConnected) {
    logger.warn('Server started without an active database connection');
  } else {
    await ensureDefaultAdminExists();
  }

  server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.error(`Unable to start server: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled rejection: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
