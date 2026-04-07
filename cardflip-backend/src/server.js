import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './services/prisma.js';
import { connectRedis } from './services/redis.js';

const PORT = parseInt(process.env.PORT) || 5000;
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

io.use((socket, next) => {
  next();
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
  });
  socket.on('support:join', (ticketId) => {
    socket.join(`ticket:${ticketId}`);
  });
  socket.on('disconnect', () => {});
});

app.set('io', io);

async function bootstrap() {
  try {
    await connectDB();
    console.log('✅ Database connected');
    await connectRedis();
    console.log('✅ Redis connected');
    httpServer.listen(PORT, () => {
      console.log(`🚀 CardFlip backend running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => process.exit(0));
bootstrap();
