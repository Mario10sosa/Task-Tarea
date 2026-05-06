import { useState } from 'react';
import { useCreateBoard } from '@/hooks/useBoards';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ListPlus } from 'lucide-react';

export function CreateBoardDialog({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<string[]>(['Por hacer', 'En progreso', 'Listo']);
  const [newColumnName, setNewColumnName] = useState('');

  const createBoard = useCreateBoard();

  const addColumn = () => {
    const trimmed = newColumnName.trim();
    if (trimmed && !columns.includes(trimmed)) {
      setColumns([...columns, trimmed]);
      setNewColumnName('');
    }
  };

  const removeColumn = (col: string) => {
    setColumns(columns.filter((c) => c !== col));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || columns.length === 0) return;

    try {
      await createBoard.mutateAsync({
        projectId,
        name: name.trim(),
        columns,
      });
      setOpen(false);
      setName('');
      setColumns(['Por hacer', 'En progreso', 'Listo']);
    } catch (error) {
      console.error('Failed to create board', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary" />
            Crear Nuevo Tablero
          </DialogTitle>
          <DialogDescription>
            Los tableros son contenedores para tus tareas. Define las etapas del flujo de trabajo (columnas).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del Tablero</Label>
            <Input
              id="name"
              placeholder="Ej: Desarrollo de Producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createBoard.isPending}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label>Columns & Workflow</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[80px] items-start transition-all">
              {columns.map((col) => (
                <Badge
                  key={col}
                  variant="secondary"
                  className="pl-3 pr-1 py-1 h-8 flex items-center gap-2 text-sm shadow-sm transition-all hover:scale-105"
                >
                  {col}
                  <button
                    type="button"
                    onClick={() => removeColumn(col)}
                    className="hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {columns.length === 0 && (
                <p className="text-xs text-muted-foreground italic w-full text-center py-4">
                  No se han añadido columnas. Añade al menos una para continuar.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Nueva etapa (Ej: Revisión)"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addColumn();
                  }
                }}
                disabled={createBoard.isPending}
              />
              <Button
                type="button"
                onClick={addColumn}
                size="sm"
                variant="outline"
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={createBoard.isPending || columns.length === 0}
            >
              {createBoard.isPending ? 'Generando Tablero...' : 'Crear Tablero'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
