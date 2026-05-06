import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getThemeFactory } from '../patterns/ThemeFactory';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserProfile((req.params.id as string));
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user._id.toString() !== (req.params.id as string)) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    const { name, theme } = req.body;
    const result = await userService.updateUserProfile((req.params.id as string), name, theme);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user._id.toString() !== (req.params.id as string)) {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }
    const result = await userService.deleteUser((req.params.id as string));
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * GET /api/users/:id/theme
 * Devuelve la configuración visual generada por AbstractFactory
 * según el tema preferido del usuario.
 */
export const getUserTheme = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userService.getUserProfile(req.params.id as string);
    const factory = getThemeFactory(user.theme as string);
    const themeConfig = factory.createTheme();
    res.json({ theme: user.theme, themeConfig });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};