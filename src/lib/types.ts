export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  note_id: string;
  text: string;
  is_completed: boolean;
  order_index: number;
  created_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'text' | 'checklist';
  color: string;
  is_pinned: boolean;
  order_index: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  checklists?: ChecklistItem[];
}
