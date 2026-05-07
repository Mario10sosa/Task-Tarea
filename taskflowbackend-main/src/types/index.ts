import { Document, Types } from 'mongoose';

export type ObjectId = Types.ObjectId;

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  theme: 'light' | 'dark' | 'custom';
  createdAt: Date;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  ownerId: ObjectId;
  members: Array<{ userId: ObjectId; role: 'admin' | 'member' }>;
  createdAt: Date;
}

export interface IBoard extends Document {
  projectId: ObjectId;
  name: string;
  columns: Array<{ id: string; name: string; order: number }>;
  createdAt: Date;
}

export type TaskType = 'simple' | 'checklist' | 'timed' | 'BUG' | 'FEATURE' | 'STORY' | 'EPIC';

export interface ITask extends Document {
  boardId:         ObjectId;
  projectId:       ObjectId;
  columnId:        string;
  type:            TaskType;
  title:           string;
  description?:    string;
  priority:        'low' | 'medium' | 'high';
  assignedTo?:     ObjectId;
  dueDate?:        Date;
  checklist?:      Array<{ text: string; done: boolean }>;
  durationMinutes?: number;
  tags:            string[];
  parentTaskId?:   ObjectId;
  // Decorator fields
  labels?:         Array<{ name: string; color: string }>;
  attachments?:    Array<{
    filename:     string;
    originalName: string;
    mimetype:     string;
    size:         number;
    url:          string;
    uploadedAt:   Date;
  }>;
  createdAt: Date;
}

export interface IInvitation extends Document {
  projectId:    ObjectId;
  invitedEmail: string;
  invitedBy:    ObjectId;
  token:        string;
  status:       'pending' | 'accepted' | 'rejected';
  expiresAt:    Date;
}