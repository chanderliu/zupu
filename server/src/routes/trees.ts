import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../db';

const router = Router();

// List all trees
router.get('/', (_req: Request, res: Response) => {
  const trees = queryAll('SELECT * FROM family_trees ORDER BY updated_at DESC');
  res.json(trees);
});

// Get single tree
router.get('/:id', (req: Request, res: Response) => {
  const tree = queryOne('SELECT * FROM family_trees WHERE id = ?', [req.params.id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });
  const count = queryOne('SELECT COUNT(*) as count FROM family_members WHERE tree_id = ?', [req.params.id]) as { count: number };
  res.json({ ...tree, memberCount: count.count });
});

// Create tree
router.post('/', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: '族谱名称不能为空' });
  const id = insert('INSERT INTO family_trees (name, description) VALUES (?, ?)', [name, description || '']);
  const tree = queryOne('SELECT * FROM family_trees WHERE id = ?', [id]);
  res.status(201).json(tree);
});

// Update tree
router.put('/:id', (req: Request, res: Response) => {
  const { name, description } = req.body;
  const tree = queryOne('SELECT * FROM family_trees WHERE id = ?', [req.params.id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });
  execute(
    "UPDATE family_trees SET name = ?, description = ?, updated_at = datetime('now','localtime') WHERE id = ?",
    [name || tree.name, description ?? tree.description, req.params.id]
  );
  const updated = queryOne('SELECT * FROM family_trees WHERE id = ?', [req.params.id]);
  res.json(updated);
});

// Delete tree
router.delete('/:id', (req: Request, res: Response) => {
  const tree = queryOne('SELECT * FROM family_trees WHERE id = ?', [req.params.id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });
  execute('DELETE FROM family_trees WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
