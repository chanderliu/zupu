import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb } from './db';
import treesRouter from './routes/trees';
import membersRouter from './routes/members';
import uploadRouter from './routes/upload';

async function main() {
  await initDb();

  const app = express();
  const PORT = process.env.PORT || 3001;
  const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(cors());
  app.use(express.json());

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Routes
  app.use('/api/trees', treesRouter);
  app.use('/api/trees/:id/members', membersRouter);
  app.use('/api/upload', uploadRouter);

  // Serve client build in production
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch(console.error);
