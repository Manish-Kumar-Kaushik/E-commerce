import './config/env.js';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUiDist from 'swagger-ui-dist';
import { getDatabaseStatus } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import notFound from './middleware/notFoundMiddleware.js';
import apiRoutes from './routes/index.js';
import { morganStream } from './utils/logger.js';
import { constructWebhookEvent } from './config/stripe.js';
import { handleStripeWebhook } from './services/stripeService.js';
import { attachRequestContext } from './middleware/requestContextMiddleware.js';
import openApiSpec from './docs/openapi.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /https?:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.devtunnels\.ms$/i.test(origin);
};

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  skip: (req) => req.originalUrl.startsWith('/api/ai'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  }),
);
app.use(attachRequestContext);
app.use(morgan('dev', { stream: morganStream }));

app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing stripe-signature header' });
    }

    const event = constructWebhookEvent(req.body, signature);
    await handleStripeWebhook(event);

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error?.type === 'StripeSignatureVerificationError') {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    return next(error);
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);
app.use('/api/docs/assets', express.static(swaggerUiDist.getAbsoluteFSPath()));
app.get('/api/docs.json', (req, res) => {
  res.status(200).json(openApiSpec);
});
app.get('/api/docs', (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <title>Shopzy API Docs</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css" />
      </head>
      <body style="margin:0;">
        <div id="swagger-ui"></div>
        <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
        <script src="/api/docs/assets/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function () {
            window.ui = SwaggerUIBundle({
              url: '/api/docs.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset,
              ],
              layout: 'StandaloneLayout',
              displayRequestDuration: true,
            });
          };
        </script>
      </body>
    </html>
  `);
});
app.use(
  '/media/products',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(process.cwd(), 'uploads', 'products')),
);

app.get('/', (req, res) => {
  const port = process.env.PORT || 5000;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Shopzy Backend</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🛍️ Shopzy Backend Server</h1>
        <p>Server is running on port ${port}</p>
        <p><a href="/health">Health Check</a></p>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  const database = getDatabaseStatus();
  const isHealthy = database === 'connected' || process.env.REQUIRE_DB !== 'true';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
