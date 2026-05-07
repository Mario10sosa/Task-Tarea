export interface User {
  id: string;
  name: string;
  email: string;
  theme?: string;
}

// userId puede llegar como objeto populado o como string (ObjectId sin popular)
export type PopulatedUser = {
  _id: string;
  name: string;
  email: string;
};

export interface ProjectMember {
  _id?: string;
  userId: PopulatedUser | string;
  role: 'admin' | 'member';
}

// Helpers centralizados para extraer datos de un miembro
export function getMemberName(member: ProjectMember): string {
  if (!member.userId) return 'Sin nombre';
  if (typeof member.userId === 'object') return member.userId.name || 'Sin nombre';
  return 'Sin nombre';
}

export function getMemberEmail(member: ProjectMember): string {
  if (!member.userId) return '';
  if (typeof member.userId === 'object') return member.userId.email || '';
  return '';
}

export function getMemberId(member: ProjectMember): string {
  if (!member.userId) return '';
  if (typeof member.userId === 'object') return member.userId._id;
  return member.userId;
}

export function getMemberInitials(member: ProjectMember): string {
  const name = getMemberName(member);
  if (name === 'Sin nombre') return '??';
  return name.substring(0, 2).toUpperCase();
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: ProjectMember[];
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