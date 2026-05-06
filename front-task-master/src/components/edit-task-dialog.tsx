import { useState, useEffect, useMemo } from 'react';
import { useUpdateTask } from '@/hooks/useTasks';
import { useAuth } from '@/store/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import type { Task } from '@/lib/types';

export function EditTaskDialog({ 
  task,
  boardId,
  open,
  onOpenChange,
  members = []
}: { 
  task: Task;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members?: any[];
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [type, setType] = useState(task.type || 'simple');
  const [priority, setPriority] = useState(task.priority || 'medium');
  
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [durationMinutes, setDurationMinutes] = useState(task.durationMinutes?.toString() || '');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>(task.checklist || []);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [newItem, setNewItem] = useState('');
  
  const updateTask = useUpdateTask();
  const { user: currentUser } = useAuth();

  const projectMembers = useMemo(() => {
    // Combine project members and the current user (if not already included)
    const allMembers = [...(members || [])];
    
    // Add current user if not already in members
    if (currentUser) {
      const currentUserId = currentUser.id || (currentUser as any)?._id;
      const alreadyIn = allMembers.some(m => {
        const id = typeof m === 'string' ? m : (m as any)?._id || (m as any)?.id;
        return id === currentUserId;
      });
      
      if (!alreadyIn && currentUserId) {
        allMembers.unshift(currentUser as any);
      }
    }

    return allMembers.map((member, idx) => {
      // Robust extraction of ID and Name
      const memberId = (member as any)?._id || (member as any)?.id || (typeof member === 'string' ? member : '');
      
      // Try multiple possible name fields, including nested user object
      const memberName = 
        (member as any)?.name || 
        (member as any)?.fullName || 
        (member as any)?.user?.name ||
        (member as any)?.user?.fullName ||
        (member as any)?.email ||
        (member as any)?.user?.email ||
        (typeof member === 'string' ? `User (${member.slice(-4)})` : `Member ${idx + 1}`);

      return {
        id: memberId,
        name: memberName
      };
    });
  }, [members, currentUser]);

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setType(task.type || 'simple');
      setPriority(task.priority || 'medium');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setDurationMinutes(task.durationMinutes?.toString() || '');
      setChecklist(task.checklist || []);
      setAssignedTo(task.assignedTo || '');
    }
  }, [open, task]);

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
      await updateTask.mutateAsync({
        taskId: task._id,
        boardId,
        payload: {
          type,
          title: title.trim(),
          description: description.trim(),
          priority: priority as any,
          dueDate: dueDate || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          checklist: checklist.length > 0 ? checklist : undefined,
          assignedTo: assignedTo || undefined,
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de esta tarea.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateTask.isPending}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Descripción (opcional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateTask.isPending}
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Tarea</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)} disabled={updateTask.isPending}>
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
              <Select value={priority} onValueChange={(v) => setPriority(v as any)} disabled={updateTask.isPending}>
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

          <div className="grid grid-cols-2 gap-4">
            {type === 'timed' && (
              <div className="grid gap-2">
                <Label htmlFor="edit-dueDate">Fecha de Entrega</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={updateTask.isPending}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Asignado a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} disabled={updateTask.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned_item">Sin asignar</SelectItem>
                  {projectMembers.map((member, idx) => (
                    <SelectItem key={`${member.id}-${idx}`} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'checklist' && (
            <div className="grid gap-2 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="flex items-center justify-between">
                Lista de Tareas
                <span className="text-[10px] text-muted-foreground font-normal">Opcional</span>
              </Label>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/50 border border-border/50 p-2 rounded-md text-sm">
                    <span>{item.text}</span>
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
                    placeholder="Añadir elemento..."
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                    disabled={updateTask.isPending}
                  />
                  <Button type="button" onClick={addItem} size="sm" variant="outline" disabled={updateTask.isPending}>
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button type="submit" className="w-full" disabled={updateTask.isPending}>
              {updateTask.isPending ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
