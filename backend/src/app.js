const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const requestId = require('./middleware/requestId');
const rateLimit = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const vaultRoutes = require('./routes/vault');
const deadmanRoutes = require('./routes/deadman');

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean);

app.set('trust proxy', 1);
app.use(requestId);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX));
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms req_id=:req[x-request-id]', {
    skip: () => env.NODE_ENV === 'test',
  })
);

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'digital-will-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/deadman', deadmanRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
