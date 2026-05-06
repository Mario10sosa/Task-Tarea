import { Invitation } from '../models/Invitation';
import { Project } from '../models/Project';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import { NotificationManager } from '../structuralpattern/NotificationAdapter';

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

  // Obtener nombre del proyecto e invitador para el mensaje
  const [project, inviter] = await Promise.all([
    Project.findById(projectId).select('name'),
    User.findById(invitedBy).select('name _id'),
  ]);

  const projectName = project?.name || 'un proyecto';
  const inviterName = inviter?.name || 'Un compañero';
  const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invitations?token=${token}`;

  // Patron Adapter: el servicio usa NotificationManager (Target),
  // sin conocer si el canal es Email, SMS o InApp.
  const emailManager = NotificationManager.emailOnly();
  await emailManager.notify({
    to: invitedEmail,
    subject: `Invitacion al proyecto "${projectName}"`,
    body: `${inviterName} te ha invitado a colaborar en "${projectName}". Acepta aqui: ${acceptLink}. Esta invitacion expira en 48 horas.`,
    metadata: { type: 'invitation', token, projectId },
  });

  // Notificar InApp al invitador confirmando el envio
  if (inviter) {
    const inAppManager = NotificationManager.inAppOnly();
    await inAppManager.notify({
      to: inviter._id.toString(),
      subject: 'Invitacion enviada',
      body: `Se envio una invitacion a ${invitedEmail} para unirse a "${projectName}".`,
      metadata: { type: 'general' },
    });
  }

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

  const exists = project.members.find((m) => m.userId.toString() === userId.toString());
  if (!exists) {
    project.members.push({ userId: userId as any, role: 'member' });
    await project.save();
  }

  invitation.status = 'accepted';
  await invitation.save();

  // Notificar InApp al usuario que fue aceptado
  const inAppManager = NotificationManager.inAppOnly();
  await inAppManager.notify({
    to: userId,
    subject: 'Te uniste a un proyecto',
    body: `Ahora eres miembro del proyecto "${project.name}".`,
    metadata: { type: 'invitation' },
  });

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