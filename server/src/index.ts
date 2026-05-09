import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
import treesRouter from './routes/trees';
import membersRouter from './routes/members';
import uploadRouter from './routes/upload';

async function main() {
  await initDb();

  const app = express();
  const PORT = 3001;

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // Routes
  app.use('/api/trees', treesRouter);
  app.use('/api/trees/:id/members', membersRouter);
  app.use('/api/upload', uploadRouter);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
