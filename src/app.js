const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const session = require('express-session');
const helmet = require('helmet');
const { createServer } = require('http');
const compression = require('compression');
const logger = require('./lib/logger');
const routes = require('./routes');
const { Server } = require('socket.io');
const Notification = require('./models/Notification');

dotenv.config({ override: true });
process.env.TZ = 'Etc/UTC';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env');
}

if (!process.env.PORT) {
  throw new Error('Please add your port to .env');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

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
  })
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
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json());

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online.`);
  });

  socket.on("disconnect", () => {
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
      }
    });
    console.log("User disconnected:", socket.id);
  });
});

const sendNotification = async (recipientId, notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();

    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newNotification", notification);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(routes);

server.listen(process.env.PORT, () => {
  logger.info(`⚡️ server is running on port ${process.env.PORT}`);
});

const graceful = async () => {
  await mongoose.connection.close();
  logger.info('💀 Mongoose connection closed, goodbye!');
  server.close(() => {
    logger.info('💀 server closed ');
    process.exit(0);
  });
};

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

module.exports = { io, sendNotification, onlineUsers };
