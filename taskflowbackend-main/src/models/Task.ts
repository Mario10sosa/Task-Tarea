import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    boardId:      { type: Schema.Types.ObjectId, ref: 'Board',    required: true },
    projectId:    { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
    columnId:     { type: String, required: true },
    type: {
      type: String,
      enum: ['simple', 'checklist', 'timed', 'BUG', 'FEATURE', 'STORY', 'EPIC'],
      required: true,
    },
    title:           { type: String, required: true },
    description:     { type: String },
    priority:        { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignedTo:      { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate:         { type: Date },
    checklist: [
      {
        text: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    durationMinutes: { type: Number },
    tags:            [{ type: String }],
    parentTaskId:    { type: Schema.Types.ObjectId, ref: 'Task', default: null },

    // Decorator: etiquetas de color personalizadas
    labels: [
      {
        name:  { type: String, required: true },
        color: { type: String, required: true }, // hex color
      },
    ],

    // Decorator: archivos adjuntos
    attachments: [
      {
        filename:     { type: String, required: true },
        originalName: { type: String, required: true },
        mimetype:     { type: String, required: true },
        size:         { type: Number, required: true },
        url:          { type: String, required: true },
        uploadedAt:   { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

taskSchema.index({ parentTaskId: 1 });
taskSchema.index({ projectId: 1, columnId: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);