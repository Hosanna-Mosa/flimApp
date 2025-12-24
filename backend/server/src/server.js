require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const registerChatHandlers = require('./sockets/chat.socket');
const configureCloudinary = require('./config/cloudinary');
const logger = require('./config/logger');

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB(process.env.MONGODB_URI);
  configureCloudinary();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  registerChatHandlers(io);

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

start();

