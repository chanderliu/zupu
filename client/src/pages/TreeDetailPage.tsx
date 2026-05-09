import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { treeApi, memberApi } from '../api';
import type { FamilyTree, FamilyMember } from '../types';
import MemberList from '../components/MemberList';
import MemberForm from '../components/MemberForm';
import ConfirmDialog from '../components/ConfirmDialog';
import FamilyTreeView from '../components/FamilyTree';

export default function TreeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const treeId = Number(id);

  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Form state
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [defaultGen, setDefaultGen] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([treeApi.get(treeId), memberApi.list(treeId)]);
      setTree(t);
      setMembers(m);
    } catch (err) {
      console.error('加载族谱失败:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [treeId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (data: Partial<FamilyMember>) => {
    if (editMember) {
      await memberApi.update(treeId, editMember.id, data);
    } else {
      await memberApi.create(treeId, data);
    }
    setShowForm(false);
    setEditMember(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await memberApi.delete(treeId, deleteTarget.id);
    setDeleteTarget(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!tree) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">← 返回列表</Link>
          <h1 className="text-2xl font-bold text-gray-800">{tree.name}</h1>
          {tree.description && <p className="text-gray-500 text-sm mt-1">{tree.description}</p>}
          <p className="text-gray-400 text-xs mt-1">共 {members.length} 人</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'tree' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              树形图
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            >
              列表
            </button>
          </div>
          <Link
            to={`/tree/${treeId}/upload`}
            className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            📷 上传族谱
          </Link>
          <button
            onClick={() => { setEditMember(null); setDefaultGen(1); setShowForm(true); }}
            className="bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            + 添加成员
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'tree' ? (
        <FamilyTreeView
          members={members}
          onMemberClick={(m) => { setEditMember(m); setShowForm(true); }}
        />
      ) : (
        <MemberList
          members={members}
          onEdit={(m) => { setEditMember(m); setShowForm(true); }}
          onDelete={(m) => setDeleteTarget(m)}
          onAdd={(gen) => { setEditMember(null); setDefaultGen(gen); setShowForm(true); }}
        />
      )}

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          member={editMember}
          allMembers={members}
          treeId={treeId}
          defaultGeneration={defaultGen}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMember(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="删除成员"
          message={`确定要删除「${deleteTarget.name}」吗？其子女的父/母关系将被清空。`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
