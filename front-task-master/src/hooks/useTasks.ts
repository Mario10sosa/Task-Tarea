import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task } from '@/lib/types';
import { toast } from 'sonner';

export function useTasks(boardId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Task[] }>(`/tasks/board/${boardId}`);
      return Array.isArray(data) ? data : data.data;
    },
    enabled: !!boardId,
  });
}

export function useCreateTaskFactory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, payload }: { boardId: string, payload: any }) => {
      const { data } = await api.post(`/tasks/board/${boardId}/factory`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
      toast.success("Tarea creada", { description: "La tarea ha sido añadida exitosamente." });
    },
    onError: (err: any) => {
      toast.error("Error al crear tarea", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, columnId }: { taskId: string; columnId: string, boardId: string }) => {
      const { data } = await api.put(`/tasks/${taskId}/move`, { columnId });
      return data;
    },
    onMutate: async ({ taskId, columnId, boardId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['tasks', boardId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', boardId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks', boardId], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.map((task) =>
          task._id === taskId ? { ...task, columnId } : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks, boardId };
    },
    onError: (err: any, _variables, context) => {
      // Roll back to the previous value if there's an error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', context.boardId], context.previousTasks);
      }
      toast.error("Error al mover tarea", { description: err.response?.data?.message || err.message });
    },
    onSettled: (_data, _error, variables, _context) => {
      // Always refetch after error or success to keep in sync
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
    },
  });
}
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: Partial<Task>; boardId: string }) => {
      const { data } = await api.put(`/tasks/${taskId}`, payload);
      return data;
    },
    onMutate: async ({ taskId, payload, boardId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', boardId] });
      const previousTasks = queryClient.getQueryData(['tasks', boardId]);
      queryClient.setQueryData(['tasks', boardId], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.map((task) =>
          task._id === taskId ? { ...task, ...payload } : task
        );
      });
      return { previousTasks, boardId };
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', context.boardId], context.previousTasks);
      }
      toast.error("Error al actualizar tarea", { description: err.response?.data?.message || err.message });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; boardId: string }) => {
      const { data } = await api.delete(`/tasks/${taskId}`);
      return data;
    },
    onMutate: async ({ taskId, boardId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', boardId] });
      const previousTasks = queryClient.getQueryData(['tasks', boardId]);
      queryClient.setQueryData(['tasks', boardId], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.filter((task) => task._id !== taskId);
      });
      return { previousTasks, boardId };
    },
    onSuccess: () => {
      toast.success("Tarea eliminada", { description: "La tarea ha sido borrada del tablero." });
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', context.boardId], context.previousTasks);
      }
      toast.error("Error al eliminar tarea", { description: err.response?.data?.message || err.message });
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
    },
  });
}

export function useCloneTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, boardId, columnId }: { taskId: string; boardId: string; columnId?: string }) => {
      if (!taskId) throw new Error("taskId is required for cloning");
      if (!boardId) throw new Error("boardId is required for cloning");
      
      const { data } = await api.post(`/tasks/${taskId}/clone`, { 
        boardId,
        columnId: columnId || undefined
      });
      return data as Task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
      toast.success("Tarea clonada", { description: "Se ha creado una copia de la tarea." });
    },
    onError: (err: any) => {
      toast.error("Error al clonar tarea", { description: err.response?.data?.message || err.message });
    }
  });
}

export function useCreateTaskBuilder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ boardId, payload }: { boardId: string; payload: any }) => {
      const { data } = await api.post(`/tasks/board/${boardId}/builder`, payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] });
    },
  });
}
