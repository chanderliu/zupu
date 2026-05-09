export interface FamilyTree {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  created_at: string;
  updated_at: string;
  memberCount?: number;
}

export interface FamilyMember {
  id: number;
  tree_id: number;
  name: string;
  gender: 'male' | 'female';
  generation: number;
  father_id: number | null;
  mother_id: number | null;
  spouse_id: number | null;
  birth_year: string;
  death_year: string;
  avatar_url: string;
  bio: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TreePhoto {
  id: number;
  tree_id: number;
  photo_url: string;
  ocr_result: string;
  status: 'pending' | 'reviewed' | 'imported';
  created_at: string;
}
