import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Board } from '@/lib/types';
import { toast } from 'sonner';

export function useBoards(projectId: string | undefined) {
  return useQuery({
    queryKey: ['boards', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Board[] }>(`/boards/project/${projectId}`);
      return Array.isArray(data) ? data : data.data; 
    },
    enabled: !!projectId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, name, columns }: { projectId: string; name: string; columns: string[] }) => {
      const formattedColumns = columns.map((colName, index) => ({
        id: colName,
        name: colName,
        order: index
      }));
      const { data } = await api.post(`/boards/project/${projectId}`, { name, columns: formattedColumns });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.projectId] });
      toast.success("Tablero creado", { description: "Ahora puedes empezar a organizar tus tareas." });
    },
    onError: (err: any) => {
      toast.error("Error al crear tablero", { description: err.response?.data?.message || err.message });
    }
  });
}
