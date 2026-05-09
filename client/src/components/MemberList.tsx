import type { FamilyMember } from '../types';

interface Props {
  members: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onAdd: (generation: number) => void;
}

export default function MemberList({ members, onEdit, onDelete, onAdd }: Props) {
  const grouped = new Map<number, FamilyMember[]>();
  members.forEach((m) => {
    const arr = grouped.get(m.generation) || [];
    arr.push(m);
    grouped.set(m.generation, arr);
  });

  const generations = Array.from(grouped.keys()).sort((a, b) => a - b);

  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">该族谱还没有成员</p>
        <button
          onClick={() => onAdd(1)}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          + 添加始祖
        </button>
      </div>
    );
  }

  const findName = (id: number | null) => {
    if (!id) return '';
    const m = members.find((x) => x.id === id);
    return m ? m.name : '';
  };

  const genderLabel = (g: string) => (g === 'male' ? '男' : '女');

  return (
    <div className="space-y-6">
      {generations.map((gen) => (
        <div key={gen}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              第 {gen} 世
            </h3>
            <button
              onClick={() => onAdd(gen)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              + 添加本世成员
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">姓名</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">性别</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">父</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">配偶</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">生卒年</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {grouped.get(gen)!.map((m) => (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${m.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                            {m.name[0]}
                          </div>
                        )}
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{genderLabel(m.gender)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{findName(m.father_id)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{findName(m.spouse_id)}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {[m.birth_year, m.death_year].filter(Boolean).join(' - ')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onEdit(m)} className="text-primary-600 hover:text-primary-700 mr-3 text-xs">编辑</button>
                      <button onClick={() => onDelete(m)} className="text-red-500 hover:text-red-600 text-xs">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="text-center pt-2">
        <button
          onClick={() => onAdd(Math.max(...generations) + 1)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          + 添加下一代
        </button>
      </div>
    </div>
  );
}
