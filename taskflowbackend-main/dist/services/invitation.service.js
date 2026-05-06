"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectInvitation = exports.acceptInvitation = exports.getInvitationByToken = exports.createInvitation = void 0;
const Invitation_1 = require("../models/Invitation");
const Project_1 = require("../models/Project");
const uuid_1 = require("uuid");
const createInvitation = async (projectId, invitedEmail, invitedBy) => {
    const token = (0, uuid_1.v4)();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    const invitation = await Invitation_1.Invitation.create({
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
exports.createInvitation = createInvitation;
const getInvitationByToken = async (token) => {
    const invitation = await Invitation_1.Invitation.findOne({ token }).populate('projectId', 'name');
    if (!invitation)
        throw new Error('Invitation not found');
    if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation expired');
    }
    return invitation;
};
exports.getInvitationByToken = getInvitationByToken;
const acceptInvitation = async (token, userId) => {
    const invitation = await Invitation_1.Invitation.findOne({ token, status: 'pending' });
    if (!invitation)
        throw new Error('Invalid or already processed invitation');
    if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation expired');
    }
    const project = await Project_1.Project.findById(invitation.projectId);
    if (!project)
        throw new Error('Project not found');
    // Check if member already exists
    const exists = project.members.find((m) => m.userId.toString() === userId.toString());
    if (!exists) {
        project.members.push({ userId: userId, role: 'member' });
        await project.save();
    }
    invitation.status = 'accepted';
    await invitation.save();
    return { message: 'Invitation accepted and added to project' };
};
exports.acceptInvitation = acceptInvitation;
const rejectInvitation = async (token) => {
    const invitation = await Invitation_1.Invitation.findOne({ token, status: 'pending' });
    if (!invitation)
        throw new Error('Invalid or already processed invitation');
    invitation.status = 'rejected';
    await invitation.save();
    return { message: 'Invitation rejected' };
};
exports.rejectInvitation = rejectInvitation;
