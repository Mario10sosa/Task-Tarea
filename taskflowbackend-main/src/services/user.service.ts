import { User } from '../models/User';
import { getThemeFactory } from '../patterns/ThemeFactory';

export const getUserProfile = async (id: string) => {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) throw new Error('User not found');
  return user;
};

export const updateUserProfile = async (id: string, name?: string, theme?: 'light' | 'dark' | 'custom') => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  if (name) user.name = name;
  if (theme) {
    user.theme = theme;
    // Apply Abstract Factory pattern specifically mentioned in plan
    const factory = getThemeFactory(theme);
    const themeConfig = factory.createTheme();
    // In a real app we might return this config or use it, for now we just show it's used
  }

  const updatedUser = await user.save();
  return {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    theme: updatedUser.theme,
  };
};

export const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  await user.deleteOne();
  return { message: 'User removed' };
};
