export interface User {
  id: string;
  name: string;
  email: string;
  theme?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id?: string;
  id: string;
  name: string;
  order: number;
}

export interface Board {
  _id: string;
  projectId: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  boardId: string;
  projectId: string;
  columnId: string;
  type: 'simple' | 'checklist' | 'timed';
  title: string;
  description?: string;
  status?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  checklist?: { text: string; done: boolean }[];
  durationMinutes?: number;
  storyPoints?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
