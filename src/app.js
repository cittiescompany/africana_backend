import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import session from 'express-session';
import helmet from 'helmet';
import { createServer } from 'http';
import compression from 'compression';
import logger from './lib/logger.js';
import routes from './routes/index.js';

dotenv.config({ overRide: true });
process.env.TZ = 'Etc/UTC';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env');
}

if (!process.env.PORT) {
  throw new Error('Please add your port to .env');
}

const app = express();
const Server = createServer(app);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });

app.set('trust proxy', 2);
app.use(
  compression({
    level: 6,
    threshold: 100 * 1000,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }),
);
app.use(cors());
app.use(helmet());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

app.use(routes);

Server.listen(process.env.PORT, () => {
  logger.info(`⚡️ Server is running on port ${process.env.PORT}`);
});

const graceful = async () => {
  await mongoose.connection.close();
  logger.info('💀 Mongoose connection closed, goodbye!');
  Server.close(() => {
    logger.info('💀 Server closed ');
    process.exit(0);
  });
};

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
