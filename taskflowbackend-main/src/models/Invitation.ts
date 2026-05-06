import mongoose, { Schema } from 'mongoose';
import { IInvitation } from '../types';

const invitationSchema = new Schema<IInvitation>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    invitedEmail: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false } // We'll manage creation manually or add timestamps if wanted, but plan.md only asked for expiresAt explicitly
);

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
