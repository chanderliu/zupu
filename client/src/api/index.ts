import type { FamilyTree, FamilyMember, TreePhoto } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

// Trees
export const treeApi = {
  list: () => request<FamilyTree[]>('/trees'),
  get: (id: number) => request<FamilyTree>(`/trees/${id}`),
  create: (data: { name: string; description?: string }) =>
    request<FamilyTree>('/trees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; description?: string }) =>
    request<FamilyTree>(`/trees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/trees/${id}`, { method: 'DELETE' }),
};

// Members
export const memberApi = {
  list: (treeId: number) => request<FamilyMember[]>(`/trees/${treeId}/members`),
  get: (treeId: number, memberId: number) =>
    request<FamilyMember>(`/trees/${treeId}/members/${memberId}`),
  create: (treeId: number, data: Partial<FamilyMember>) =>
    request<FamilyMember>(`/trees/${treeId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (treeId: number, memberId: number, data: Partial<FamilyMember>) =>
    request<FamilyMember>(`/trees/${treeId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (treeId: number, memberId: number) =>
    request<{ success: boolean }>(`/trees/${treeId}/members/${memberId}`, {
      method: 'DELETE',
    }),
};

// Upload
export const uploadApi = {
  avatar: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/upload/avatar`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  },
  treePhoto: async (file: File, treeId: number): Promise<TreePhoto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tree_id', String(treeId));
    const res = await fetch(`${BASE}/upload/tree-photo`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  },
  updateOcr: (photoId: number, ocr_result: string, status: string) =>
    request<TreePhoto>(`/upload/tree-photo/${photoId}/ocr`, {
      method: 'PUT',
      body: JSON.stringify({ ocr_result, status }),
    }),
  getTreePhotos: (treeId: number) => request<TreePhoto[]>(`/upload/tree-photos/${treeId}`),
};
