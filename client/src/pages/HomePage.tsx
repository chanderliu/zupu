import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { treeApi } from '../api';
import type { FamilyTree } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HomePage() {
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FamilyTree | null>(null);

  const fetchTrees = async () => {
    try {
      const data = await treeApi.list();
      setTrees(data);
    } catch (err) {
      console.error('获取族谱列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrees(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await treeApi.delete(deleteTarget.id);
      setTrees(trees.filter((t) => t.id !== deleteTarget.id));
    } catch (err) {
      alert('删除失败');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">我的族谱</h1>
        <Link
          to="/tree/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          + 新建族谱
        </Link>
      </div>

      {trees.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-500 text-lg mb-4">还没有族谱</p>
          <Link to="/tree/new" className="text-primary-600 hover:text-primary-700 font-medium">
            创建第一个族谱 →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <div
              key={tree.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-3">
                <Link to={`/tree/${tree.id}`} className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors">
                    {tree.name}
                  </h3>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); setDeleteTarget(tree); }}
                  className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-sm"
                >
                  删除
                </button>
              </div>
              {tree.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{tree.description}</p>
              )}
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>成员: {tree.memberCount ?? 0} 人</span>
                <span>{tree.updated_at?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="删除族谱"
          message={`确定要删除「${deleteTarget.name}」吗？此操作不可撤销，族谱下所有成员将被一并删除。`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
