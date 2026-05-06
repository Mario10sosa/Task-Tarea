import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useInviteUser() {
  return useMutation({
    mutationFn: async ({ projectId, email }: { projectId: string; email: string }) => {
      const { data } = await api.post(`/invitations/project/${projectId}`, { email });
      return data;
    },
    onSuccess: () => {
      toast.success("Invitación enviada", { description: "Se ha enviado un correo al usuario." });
    },
    onError: (err: any) => {
      toast.error("Error al enviar invitación", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useInvitation(token: string | undefined) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data } = await api.get(`/invitations/${token}`);
      return data;
    },
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/invitations/${token}/accept`);
      return data;
    },
    onSuccess: () => {
      toast.success("Invitación aceptada", { description: "Te has unido al proyecto exitosamente." });
    },
    onError: (err: any) => {
      toast.error("Error al aceptar invitación", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useRejectInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/invitations/${token}/reject`);
      return data;
    },
    onSuccess: () => {
      toast.success("Invitación rechazada", { description: "La invitación ha sido eliminada." });
    },
    onError: (err: any) => {
      toast.error("Error al rechazar invitación", { description: err.response?.data?.message || err.message });
    }
  });
}

export function usePendingInvitations(projectId: string) {
  return useQuery({
    queryKey: ['invitations', 'project', projectId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invitations/project/${projectId}`);
        return data;
      } catch (err) {
        console.warn('Invitations list endpoint not found, returning empty array');
        return [];
      }
    },
    enabled: !!projectId,
  });
}

export function useUserInvitations() {
  return useQuery({
    queryKey: ['invitations', 'user'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/invitations');
        return data;
      } catch (err) {
        console.warn('Personal invitations endpoint failed');
        return [];
      }
    },
  });
}
