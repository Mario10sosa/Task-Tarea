import { Request, Response } from 'express';
import * as boardService from '../services/board.service';

export const getBoards = async (req: Request, res: Response) => {
  try {
    const boards = await boardService.getProjectBoards((req.params.id as string));
    res.json(boards);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { name, columns } = req.body;
    const board = await boardService.createBoard((req.params.id as string), name, columns);
    res.status(201).json(board);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  try {
    const { name, columns } = req.body;
    const board = await boardService.updateBoard((req.params.id as string), { name, columns });
    res.json(board);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const result = await boardService.deleteBoard((req.params.id as string));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
