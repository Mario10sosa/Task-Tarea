import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    theme: { type: String, enum: ['light', 'dark', 'custom'], default: 'light' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
