import { useState, useEffect } from 'react';
import type { FamilyMember } from '../types';
import { uploadApi } from '../api';

interface Props {
  member?: FamilyMember | null;
  allMembers: FamilyMember[];
  treeId: number;
  defaultGeneration?: number;
  onSave: (data: Partial<FamilyMember>) => Promise<void>;
  onCancel: () => void;
}

export default function MemberForm({ member, allMembers, treeId, defaultGeneration, onSave, onCancel }: Props) {
  const isEdit = !!member;
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [generation, setGeneration] = useState(1);
  const [fatherId, setFatherId] = useState<number | null>(null);
  const [motherId, setMotherId] = useState<number | null>(null);
  const [spouseId, setSpouseId] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setGender(member.gender);
      setGeneration(member.generation);
      setFatherId(member.father_id);
      setMotherId(member.mother_id);
      setSpouseId(member.spouse_id);
      setBirthYear(member.birth_year);
      setDeathYear(member.death_year);
      setBio(member.bio);
      setAvatarUrl(member.avatar_url);
    } else if (defaultGeneration) {
      setGeneration(defaultGeneration);
    }
  }, [member, defaultGeneration]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadApi.avatar(file);
      setAvatarUrl(result.url);
    } catch {
      setError('头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('请输入姓名'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        gender,
        generation,
        father_id: fatherId,
        mother_id: motherId,
        spouse_id: spouseId,
        birth_year: birthYear,
        death_year: deathYear,
        bio,
        avatar_url: avatarUrl,
      });
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // Filter members for parent/child selection within same tree
  const membersInTree = allMembers.filter((m) => m.id !== member?.id);

  const selectClasses = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16 overflow-y-auto" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isEdit ? '编辑成员' : '添加成员'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg ${gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                  {name[0] || '?'}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 bg-white rounded-full shadow border p-1 cursor-pointer hover:bg-gray-50">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <span className="text-xs text-gray-400">{uploading ? '上传中...' : '点击上传头像'}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">姓名 *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={selectClasses} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">性别</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className={selectClasses}>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">世代</label>
            <input type="number" min={1} value={generation} onChange={(e) => setGeneration(Number(e.target.value))} className={selectClasses} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">父</label>
              <select value={fatherId ?? ''} onChange={(e) => setFatherId(e.target.value ? Number(e.target.value) : null)} className={selectClasses}>
                <option value="">未知</option>
                {membersInTree.filter((m) => m.gender === 'male').map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (第{m.generation}世)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">母</label>
              <select value={motherId ?? ''} onChange={(e) => setMotherId(e.target.value ? Number(e.target.value) : null)} className={selectClasses}>
                <option value="">未知</option>
                {membersInTree.filter((m) => m.gender === 'female').map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (第{m.generation}世)</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">配偶</label>
            <select value={spouseId ?? ''} onChange={(e) => setSpouseId(e.target.value ? Number(e.target.value) : null)} className={selectClasses}>
              <option value="">无</option>
              {membersInTree.filter((m) => m.id !== fatherId && m.id !== motherId).map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.gender === 'male' ? '男' : '女'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">出生年份</label>
              <input type="text" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={selectClasses} placeholder="如：1900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">卒年</label>
              <input type="text" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} className={selectClasses} placeholder="如：1980" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">生平简介</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={selectClasses + ' resize-none'} />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm">取消</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
