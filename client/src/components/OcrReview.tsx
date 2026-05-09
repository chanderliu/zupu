import { useState } from 'react';
import type { FamilyMember } from '../types';

interface Props {
  photoUrl: string;
  ocrText: string;
  existingMembers: FamilyMember[];
  onImport: (members: OcrMemberDraft[]) => Promise<void>;
  onSaveOcr: (text: string) => Promise<void>;
}

export interface OcrMemberDraft {
  name: string;
  gender: 'male' | 'female';
  generation: number;
  father_id: number | null;
  birth_year: string;
}

export default function OcrReview({ photoUrl, ocrText, existingMembers, onImport, onSaveOcr }: Props) {
  const [editableText, setEditableText] = useState(ocrText);
  const [drafts, setDrafts] = useState<OcrMemberDraft[]>([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const addDraft = () => {
    setDrafts([...drafts, { name: '', gender: 'male', generation: 1, father_id: null, birth_year: '' }]);
  };

  const updateDraft = (idx: number, field: keyof OcrMemberDraft, value: any) => {
    const updated = [...drafts];
    updated[idx] = { ...updated[idx], [field]: value };
    setDrafts(updated);
  };

  const removeDraft = (idx: number) => {
    setDrafts(drafts.filter((_, i) => i !== idx));
  };

  const handleSaveOcr = async () => {
    setSaving(true);
    try {
      await onSaveOcr(editableText);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    const valid = drafts.filter((d) => d.name.trim());
    if (valid.length === 0) {
      alert('请至少添加一个成员');
      return;
    }
    setImporting(true);
    try {
      await onImport(valid);
      setDrafts([]);
    } finally {
      setImporting(false);
    }
  };

  // Use OCR text lines as suggestions
  const textLines = editableText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const fillFromLine = (idx: number, line: string) => {
    updateDraft(idx, 'name', line);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Photo + OCR text */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <img src={photoUrl} alt="族谱照片" className="w-full object-contain max-h-80" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">OCR 识别结果</h3>
            <button
              onClick={handleSaveOcr}
              disabled={saving}
              className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono"
            placeholder="OCR识别文字将显示在这里，你可以手动编辑修正..."
          />
        </div>

        {/* Recognized lines */}
        {textLines.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">识别到的文本行 ({textLines.length})</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
              {textLines.map((line, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-700 hover:bg-primary-50 px-2 py-1 rounded cursor-pointer transition-colors"
                  onClick={() => {
                    const emptyIdx = drafts.findIndex((d) => !d.name.trim());
                    if (emptyIdx >= 0) {
                      fillFromLine(emptyIdx, line);
                    } else {
                      addDraft();
                      const newIdx = drafts.length;
                      setTimeout(() => fillFromLine(newIdx, line), 0);
                    }
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">点击文本行可快速填入成员姓名</p>
          </div>
        )}
      </div>

      {/* Right: Member drafts */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            待导入成员 ({drafts.filter((d) => d.name.trim()).length})
          </h3>
          <button
            onClick={addDraft}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            + 手动添加
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {drafts.map((draft, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">#{idx + 1}</span>
                <button onClick={() => removeDraft(idx)} className="text-xs text-red-400 hover:text-red-500">移除</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">姓名 *</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraft(idx, 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">性别</label>
                  <select
                    value={draft.gender}
                    onChange={(e) => updateDraft(idx, 'gender', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">世代</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.generation}
                    onChange={(e) => updateDraft(idx, 'generation', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">出生年份</label>
                  <input
                    type="text"
                    value={draft.birth_year}
                    onChange={(e) => updateDraft(idx, 'birth_year', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">父节点</label>
                <select
                  value={draft.father_id ?? ''}
                  onChange={(e) => updateDraft(idx, 'father_id', e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">未知</option>
                  {existingMembers.filter((m) => m.gender === 'male').map((m) => (
                    <option key={m.id} value={m.id}>{m.name} (第{m.generation}世)</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {drafts.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              <p>点击左侧文本行快速添加</p>
              <p>或点击"+ 手动添加"</p>
            </div>
          )}
        </div>

        {drafts.length > 0 && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-4 w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {importing ? '导入中...' : `导入 ${drafts.filter((d) => d.name.trim()).length} 位成员`}
          </button>
        )}
      </div>
    </div>
  );
}
