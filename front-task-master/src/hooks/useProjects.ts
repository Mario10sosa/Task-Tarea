import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data as Project;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newProject: { name: string; description: string }) => {
      const { data } = await api.post('/projects', newProject);
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto creado", { description: "El nuevo proyecto está listo para usar." });
    },
    onError: (err: any) => {
      toast.error("Error al crear proyecto", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Project> }) => {
      const { data } = await api.put(`/projects/${id}`, payload);
      return data as Project;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
      toast.success("Proyecto actualizado", { description: "Los cambios han sido guardados." });
    },
    onError: (err: any) => {
      toast.error("Error al actualizar proyecto", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/projects/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto eliminado", { description: "El proyecto ha sido borrado exitosamente." });
    },
    onError: (err: any) => {
      toast.error("Error al eliminar proyecto", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useCloneProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/projects/${id}/clone`);
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto clonado", { description: "Se ha creado una copia idéntica del proyecto." });
    },
    onError: (err: any) => {
      toast.error("Error al clonar proyecto", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
      toast.success("Miembro eliminado", { description: "El usuario ya no tiene acceso al proyecto." });
    },
    onError: (err: any) => {
      toast.error("Error al eliminar miembro", { description: err.response?.data?.message || err.message });
    }
  });
}
