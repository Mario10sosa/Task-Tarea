import { Board } from '../models/Board';
import { Task } from '../models/Task';

export const getProjectBoards = async (projectId: string) => {
  return Board.find({ projectId });
};

export const createBoard = async (projectId: string, name: string, columns: any[]) => {
  return Board.create({
    projectId,
    name,
    columns,
  });
};

export const updateBoard = async (boardId: string, updates: Partial<{ name: string; columns: any[] }>) => {
  const board = await Board.findByIdAndUpdate(boardId, updates, { returnDocument: 'after' });
  if (!board) throw new Error('Board not found');
  return board;
};

export const deleteBoard = async (boardId: string) => {
  const board = await Board.findById(boardId);
  if (!board) throw new Error('Board not found');

  // Cascade delete tasks in this board
  await Task.deleteMany({ boardId });
  await board.deleteOne();

  return { message: 'Board and related tasks deleted' };
};