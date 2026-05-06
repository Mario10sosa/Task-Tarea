import mongoose, { Schema } from 'mongoose';
import { IBoard } from '../types';

const boardSchema = new Schema<IBoard>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    columns: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Board = mongoose.model<IBoard>('Board', boardSchema);
