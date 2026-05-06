import { useState } from 'react';
import { useCreateTaskFactory } from '@/hooks/useTasks';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreateTaskDialog({ 
  projectId, 
  boardId, 
  columnId, 
  children 
}: { 
  projectId: string; 
  boardId: string; 
  columnId: string; 
  children: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('simple');
  const [priority, setPriority] = useState('medium');
  
  const [dueDate, setDueDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newItem, setNewItem] = useState('');
  
  const createTask = useCreateTaskFactory();

  const addItem = () => {
    if (!newItem.trim()) return;
    setChecklist([...checklist, { text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask.mutateAsync({
        boardId,
        payload: {
          projectId,
          columnId,
          type,
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          checklist: checklist.length > 0 ? checklist : undefined,
        }
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('simple');
    setPriority('medium');
    setDueDate('');
    setDurationMinutes('');
    setChecklist([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Tarea a {columnId}</DialogTitle>
          <DialogDescription>
            Completa los detalles de la nueva tarea usando el patrón Factory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej: Implementar inicio de sesión"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createTask.isPending}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <span className="text-[10px] text-muted-foreground -mt-1 scale-95 origin-left">Notas detalladas para el equipo</span>
            <Textarea
              id="description"
              placeholder="Describe el objetivo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createTask.isPending}
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Tarea</Label>
              <Select value={type} onValueChange={setType} disabled={createTask.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="checklist">Con Checklist</SelectItem>
                  <SelectItem value="timed">Con Tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority} disabled={createTask.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'timed' && (
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Fecha de Entrega</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={createTask.isPending}
              />
            </div>
          )}

          {type === 'checklist' && (
            <div className="grid gap-2 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="flex items-center justify-between">
                Lista de Tareas
                <span className="text-[10px] text-muted-foreground font-normal">Requerido para este tipo</span>
              </Label>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 border border-border/50 p-2 rounded-md text-sm">
                    <span className="truncate flex-1">{item.text}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeItem(index)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Elemento de la tarea..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                    disabled={createTask.isPending}
                  />
                  <Button type="button" onClick={addItem} size="sm" variant="outline" disabled={createTask.isPending}>
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
