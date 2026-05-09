import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { queryAll, queryOne, insert, execute } from '../db';

const router = Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式: jpg, png, gif, webp, bmp'));
    }
  },
});

// Upload avatar
router.post('/avatar', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// Upload tree photo
router.post('/tree-photo', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const { tree_id } = req.body;
  if (!tree_id) return res.status(400).json({ error: '缺少 tree_id' });

  const tree = queryOne('SELECT id FROM family_trees WHERE id = ?', [tree_id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });

  const url = `/uploads/${req.file.filename}`;
  const photoId = insert('INSERT INTO tree_photos (tree_id, photo_url) VALUES (?, ?)', [tree_id, url]);
  const photo = queryOne('SELECT * FROM tree_photos WHERE id = ?', [photoId]);
  res.status(201).json(photo);
});

// Update OCR result
router.put('/tree-photo/:photoId/ocr', (req: Request, res: Response) => {
  const { ocr_result, status } = req.body;
  const photo = queryOne('SELECT * FROM tree_photos WHERE id = ?', [req.params.photoId]);
  if (!photo) return res.status(404).json({ error: '记录不存在' });

  execute(
    'UPDATE tree_photos SET ocr_result = ?, status = ? WHERE id = ?',
    [ocr_result || '', status || 'reviewed', req.params.photoId]
  );

  const updated = queryOne('SELECT * FROM tree_photos WHERE id = ?', [req.params.photoId]);
  res.json(updated);
});

// Get tree photos
router.get('/tree-photos/:treeId', (req: Request, res: Response) => {
  const photos = queryAll('SELECT * FROM tree_photos WHERE tree_id = ? ORDER BY created_at DESC', [req.params.treeId]);
  res.json(photos);
});

export default router;
