import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { env } from './env';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: 'http://127.0.0.1:3000' },
});

// TODO (Fase 5): montar el namespace `/game` — ver docs/PLAN.md

httpServer.listen(env.PORT, () => {
  console.log(`spotify-clone server listening on :${env.PORT}`);
});
