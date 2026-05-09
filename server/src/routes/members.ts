import { Router, Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../db';

const router = Router({ mergeParams: true });

// List members of a tree
router.get('/', (req: Request, res: Response) => {
  const { id } = req.params;
  const tree = queryOne('SELECT id FROM family_trees WHERE id = ?', [id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });
  const members = queryAll('SELECT * FROM family_members WHERE tree_id = ? ORDER BY generation ASC, sort_order ASC, id ASC', [id]);
  res.json(members);
});

// Get single member
router.get('/:memberId', (req: Request, res: Response) => {
  const member = queryOne('SELECT * FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.id]);
  if (!member) return res.status(404).json({ error: '成员不存在' });
  res.json(member);
});

// Create member
router.post('/', (req: Request, res: Response) => {
  const { id } = req.params;
  const tree = queryOne('SELECT id FROM family_trees WHERE id = ?', [id]);
  if (!tree) return res.status(404).json({ error: '族谱不存在' });

  const { name, gender, generation, father_id, mother_id, spouse_id, birth_year, death_year, avatar_url, bio, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: '姓名不能为空' });

  const memberId = insert(
    `INSERT INTO family_members (tree_id, name, gender, generation, father_id, mother_id, spouse_id, birth_year, death_year, avatar_url, bio, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, gender || 'male', generation || 1, father_id || null, mother_id || null, spouse_id || null,
     birth_year || '', death_year || '', avatar_url || '', bio || '', sort_order || 0]
  );

  const member = queryOne('SELECT * FROM family_members WHERE id = ?', [memberId]);
  res.status(201).json(member);
});

// Update member
router.put('/:memberId', (req: Request, res: Response) => {
  const member = queryOne('SELECT * FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.id]);
  if (!member) return res.status(404).json({ error: '成员不存在' });

  const { name, gender, generation, father_id, mother_id, spouse_id, birth_year, death_year, avatar_url, bio, sort_order } = req.body;

  execute(
    `UPDATE family_members SET
      name = ?, gender = ?, generation = ?, father_id = ?, mother_id = ?, spouse_id = ?,
      birth_year = ?, death_year = ?, avatar_url = ?, bio = ?, sort_order = ?,
      updated_at = datetime('now','localtime')
     WHERE id = ?`,
    [
      name ?? member.name, gender ?? member.gender, generation ?? member.generation,
      father_id !== undefined ? father_id : member.father_id,
      mother_id !== undefined ? mother_id : member.mother_id,
      spouse_id !== undefined ? spouse_id : member.spouse_id,
      birth_year ?? member.birth_year, death_year ?? member.death_year,
      avatar_url ?? member.avatar_url, bio ?? member.bio,
      sort_order ?? member.sort_order,
      req.params.memberId
    ]
  );

  const updated = queryOne('SELECT * FROM family_members WHERE id = ?', [req.params.memberId]);
  res.json(updated);
});

// Delete member
router.delete('/:memberId', (req: Request, res: Response) => {
  const member = queryOne('SELECT * FROM family_members WHERE id = ? AND tree_id = ?', [req.params.memberId, req.params.id]);
  if (!member) return res.status(404).json({ error: '成员不存在' });
  // Nullify references
  execute('UPDATE family_members SET father_id = NULL WHERE father_id = ?', [req.params.memberId]);
  execute('UPDATE family_members SET mother_id = NULL WHERE mother_id = ?', [req.params.memberId]);
  execute('UPDATE family_members SET spouse_id = NULL WHERE spouse_id = ?', [req.params.memberId]);
  execute('DELETE FROM family_members WHERE id = ?', [req.params.memberId]);
  res.json({ success: true });
});

export default router;
