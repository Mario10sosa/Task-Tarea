import { Project } from '../models/Project';
import { Board } from '../models/Board';
import { Task } from '../models/Task';
import { cloneProject } from '../patterns/Prototype';

export const getProjectsForUser = async (userId: string) => {
  return Project.find({
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
  });
};

export const createProject = async (name: string, description: string | undefined, ownerId: string) => {
  return Project.create({
    name,
    description,
    ownerId,
    members: [{ userId: ownerId, role: 'admin' }],
  });
};

export const getProjectDetails = async (projectId: string) => {
  const project = await Project.findById(projectId).populate('members.userId', 'name email theme');
  if (!project) throw new Error('Project not found');
  return project;
};

export const updateProject = async (projectId: string, updates: Partial<{ name: string; description: string }>) => {
  const project = await Project.findByIdAndUpdate(projectId, updates, { new: true });
  if (!project) throw new Error('Project not found');
  return project;
};

export const deleteProject = async (projectId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  // Cascade delete boards and tasks
  await Task.deleteMany({ projectId });
  await Board.deleteMany({ projectId });
  await project.deleteOne();

  return { message: 'Project and all related data deleted' };
};

export const cloneProjectService = async (projectId: string, ownerId: string) => {
  const newProject = await cloneProject(projectId, ownerId);
  if (!newProject) throw new Error('Project not found to clone');
  return newProject;
};

export const removeMember = async (projectId: string, memberId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  if (project.ownerId.toString() === memberId) {
    throw new Error('Cannot remove the project owner');
  }

  project.members = project.members.filter((m) => m.userId.toString() !== memberId);
  await project.save();
  return project;
};
