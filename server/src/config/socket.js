const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenchangeinproduction';

/**
 * Initialize Socket.IO server
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Required to handle proxying / sticky-session handshakes on Render
    transports: ['websocket', 'polling'],
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication failed. Token missing.'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Authentication failed. Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole } = socket;
    
    // Join a private room corresponding to their User ID
    socket.join(userId);

    // If Secretary/Admin, also join a 'secretaries' group room
    if (userRole === 'ADMIN') {
      socket.join('secretaries');
    }

    socket.on('disconnect', () => {
      // Socket.IO handles room cleanup automatically
    });
  });

  return io;
}

/**
 * Get Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Push real-time notification to a specific user
 */
function sendRealTimeNotification(userId, notification) {
  if (io) {
    io.to(userId).emit('notification', notification);
  }
}

/**
 * Broadcast real-time notification to all secretaries
 */
function broadcastToSecretaries(notification) {
  if (io) {
    io.to('secretaries').emit('notification', notification);
  }
}

module.exports = {
  initSocket,
  getIO,
  sendRealTimeNotification,
  broadcastToSecretaries,
};
