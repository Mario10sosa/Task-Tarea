import { User } from '../models/User';
import { getThemeFactory } from '../patterns/ThemeFactory';

export const getUserProfile = async (id: string) => {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) throw new Error('User not found');

  // Retornar perfil junto con la configuración visual del tema actual
  const factory = getThemeFactory(user.theme);
  const themeConfig = factory.createTheme();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    theme: user.theme,
    themeConfig, // colores generados por AbstractFactory
  };
};

export const updateUserProfile = async (id: string, name?: string, theme?: 'light' | 'dark' | 'custom') => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  if (name) user.name = name;
  if (theme) user.theme = theme;

  const updatedUser = await user.save();

  // AbstractFactory: generar configuración visual según el tema guardado
  const factory = getThemeFactory(updatedUser.theme);
  const themeConfig = factory.createTheme();

  return {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    theme: updatedUser.theme,
    themeConfig, // el frontend puede leer estos colores directamente
  };
};

export const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  await user.deleteOne();
  return { message: 'User removed' };
};