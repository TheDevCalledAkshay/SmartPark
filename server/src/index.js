import 'dotenv/config';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import lotsRouter from './routes/lots.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import { setIO } from './realtime/io.js';
import { startSimulator } from './simulator/simulator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app); // http server that hosts both Express and Socket.IO
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // allow the React frontend (different port) to call this API
app.use(express.json()); // parse JSON request bodies

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'smart-park-api',
    version: '0.4.0',
    realtime: true,
    db: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    time: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/lots', lotsRouter);
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);
// --- Serve the built React app (production / Render) ---
// Render builds the client first (client/dist), then starts this server,
// which serves those static files and falls back to index.html for
// client-side routes like /login or /bookings.
const distDir = path.resolve(__dirname, '../../client/dist');
app.use(express.static(distDir));
// Express 5 removed '*' route syntax — use a middleware fallback instead
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

// --- Connect DB, then start everything ---

// --- Connect DB, then start everything ---
await connectDB();

// Socket.IO — real-time push channel
const io = new Server(server, {
  cors: { origin: '*' },
});
setIO(io);
io.on('connection', (socket) => {
  console.log(`🔌 Client connected (${io.engine.clientsCount} online)`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected (${io.engine.clientsCount} online)`);
  });
});

// Occupancy simulator — the stand-in for the camera/satellite vision module
if ((process.env.SIMULATOR_ENABLED ?? 'true') !== 'false') {
  startSimulator(Number(process.env.SIM_INTERVAL_MS) || 5000);
} else {
  console.log('🤖 Simulator disabled (SIMULATOR_ENABLED=false)');
}

server.listen(PORT, () => {
  console.log(`✅ SmartPark API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Parking lots: http://localhost:${PORT}/api/lots`);
  console.log(`   Realtime:     ws://localhost:${PORT}/socket.io`);
});

// Graceful shutdown (Ctrl+C)
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});


