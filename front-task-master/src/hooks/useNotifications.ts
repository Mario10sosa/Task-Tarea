import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'invitation' | 'task_assigned' | 'task_due' | 'comment' | 'status_change' | 'general';
  read: boolean;
  createdAt: string;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
    refetchInterval: 30_000, // polling cada 30 seg
  });
}

export function useUnreadCount() {
  return useQuery<{ unreadCount: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    },
    refetchInterval: 30_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch(`/notifications/${notificationId}/read`);
      return data;
    },
    onSuccess: (_data, notificationId) => {
      // Actualiza solo el campo read en el cache — la notificación NO desaparece
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      // Actualiza el contador de no leídas
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.delete(`/notifications/${notificationId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}