import { create } from 'zustand';

interface User {
  id?: string;
  name?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  // Solo toma el token si también hay datos de usuario guardados
  // Esto evita que entrar al dashboard con un token "huérfano"
  token: (localStorage.getItem('token') && localStorage.getItem('user'))
    ? localStorage.getItem('token')
    : null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));