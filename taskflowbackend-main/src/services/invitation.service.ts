import { Invitation } from '../models/Invitation';
import { Project } from '../models/Project';
import { v4 as uuidv4 } from 'uuid';

export const createInvitation = async (projectId: string, invitedEmail: string, invitedBy: string) => {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const invitation = await Invitation.create({
    projectId,
    invitedEmail,
    invitedBy,
    token,
    status: 'pending',
    expiresAt,
  });

  // Mock sending email
  console.log(`Sending email to ${invitedEmail} with link /accept?token=${token}`);

  return invitation;
};

export const getInvitationByToken = async (token: string) => {
  const invitation = await Invitation.findOne({ token }).populate('projectId', 'name');
  if (!invitation) throw new Error('Invitation not found');
  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation expired');
  }
  return invitation;
};

export const acceptInvitation = async (token: string, userId: string) => {
  const invitation = await Invitation.findOne({ token, status: 'pending' });
  if (!invitation) throw new Error('Invalid or already processed invitation');
  if (invitation.expiresAt < new Date()) {
    throw new Error('Invitation expired');
  }

  const project = await Project.findById(invitation.projectId);
  if (!project) throw new Error('Project not found');

  // Check if member already exists
  const exists = project.members.find((m) => m.userId.toString() === userId.toString());
  if (!exists) {
    project.members.push({ userId: userId as any, role: 'member' });
    await project.save();
  }

  invitation.status = 'accepted';
  await invitation.save();

  return { message: 'Invitation accepted and added to project' };
};

export const rejectInvitation = async (token: string) => {
  const invitation = await Invitation.findOne({ token, status: 'pending' });
  if (!invitation) throw new Error('Invalid or already processed invitation');

  invitation.status = 'rejected';
  await invitation.save();

  return { message: 'Invitation rejected' };
};
export const getUserInvitations = async (userId: string, email: string) => {
  return Invitation.find({
    $or: [{ invitedBy: userId }, { invitedEmail: email }],
  }).populate('projectId', 'name').populate('invitedBy', 'name email');
};
