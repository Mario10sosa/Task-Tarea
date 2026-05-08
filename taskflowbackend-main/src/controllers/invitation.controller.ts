import { Request, Response } from 'express';
import * as invitationService from '../services/invitation.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const invite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    const invitation = await invitationService.createInvitation((req.params.id as string), email, req.user._id.toString());
    res.status(201).json(invitation);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInvitation = async (req: Request, res: Response) => {
  try {
    const invitation = await invitationService.getInvitationByToken((req.params.token as string));
    res.json(invitation);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const accept = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only logged in user can accept
    const result = await invitationService.acceptInvitation((req.params.token as string), req.user._id.toString());
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const reject = async (req: Request, res: Response) => {
  try {
    const result = await invitationService.rejectInvitation((req.params.token as string));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
export const getInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invitations = await invitationService.getUserInvitations(req.user._id.toString(), req.user.email);
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectInvitations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id as string;
    const { Invitation } = require('../models/Invitation');
    const invitations = await Invitation.find({ projectId, status: 'pending' });
    res.json(invitations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};