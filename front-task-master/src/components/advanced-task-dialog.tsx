import { useState, useMemo } from 'react';
import { useCreateTaskBuilder } from '@/hooks/useTasks';
import { useAuth } from '@/store/useAuth';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, X, Sparkles } from 'lucide-react';

export function AdvancedTaskDialog({ 
  projectId, 
  boardId, 
  columnId,
  members = []
}: { 
  projectId: string; 
  boardId: string; 
  columnId: string;
  members?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('simple');
  const [priority, setPriority] = useState('medium');
  const [storyPoints, setStoryPoints] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
  const [currentCriteria, setCurrentCriteria] = useState('');

  const createTaskBuilder = useCreateTaskBuilder();

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCriteria = () => {
    if (currentCriteria.trim()) {
      setAcceptanceCriteria([...acceptanceCriteria, currentCriteria.trim()]);
      setCurrentCriteria('');
    }
  };

  const removeCriteria = (index: number) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTaskBuilder.mutateAsync({
        boardId,
        payload: {
          projectId,
          columnId,
          type,
          title: title.trim(),
          description: description.trim(),
          priority,
          storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
          assignedTo: assignedTo || undefined,
          dueDate: dueDate || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          tags,
          checklist: acceptanceCriteria.map(text => ({ text, done: false })),
        }
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create advanced task', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('simple');
    setPriority('medium');
    setStoryPoints('');
    setAssignedTo('');
    setDueDate('');
    setDurationMinutes('');
    setTags([]);
    setAcceptanceCriteria([]);
  };

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
          <Sparkles className="w-4 h-4 mr-2" />
          Tarea Avanzada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Crear Tarea Avanzada
          </DialogTitle>
          <DialogDescription>
            Usa el patrón Builder para crear una tarea con detalles granulares de negocio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="adv-title">Título</Label>
            <Input
              id="adv-title"
              placeholder="Ej: Corrección de error crítico"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createTaskBuilder.isPending}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="adv-description">Descripción</Label>
            <Textarea
              id="adv-description"
              placeholder="Descripción técnica detallada..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createTaskBuilder.isPending}
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Tarea</Label>
              <Select value={type} onValueChange={setType} disabled={createTaskBuilder.isPending}>
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
              <Select value={priority} onValueChange={setPriority} disabled={createTaskBuilder.isPending}>
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
            <div className="grid gap-2">
              <Label htmlFor="story-points">Puntos de Historia</Label>
              <Input
                id="story-points"
                type="number"
                placeholder="Ej: 5, 8, 13"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                disabled={createTaskBuilder.isPending}
              />
            </div>
            {type === 'timed' && (
              <div className="grid gap-2">
                <Label htmlFor="duration">Duración (Min)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Ej: 60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  disabled={createTaskBuilder.isPending}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === 'timed' && (
              <div className="grid gap-2">
                <Label htmlFor="due-date">Fecha de Entrega</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={createTaskBuilder.isPending}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Asignado a</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} disabled={createTaskBuilder.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned_item">Sin asignar</SelectItem>
                  {projectMembers.map((member, idx) => {
                    if (!member.id) return null;
                    
                    return (
                      <SelectItem key={`${member.id}-${idx}`} value={member.id}>
                        {member.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pl-2 pr-1 h-6 flex items-center gap-1 group">
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Añadir etiqueta..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={createTaskBuilder.isPending}
              />
              <Button type="button" onClick={addTag} size="sm" variant="outline">Añadir</Button>
            </div>
          </div>

          {type === 'checklist' && (
            <div className="grid gap-2 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label>Criterios de Aceptación</Label>
              <ul className="space-y-2 mb-2">
                {acceptanceCriteria.map((item, index) => (
                  <li key={index} className="flex items-start justify-between bg-muted/30 p-2 rounded-md text-xs group">
                    <span className="flex-1 mr-2">• {item}</span>
                    <button 
                      type="button" 
                      onClick={() => removeCriteria(index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  placeholder="Criterio..."
                  value={currentCriteria}
                  onChange={(e) => setCurrentCriteria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCriteria();
                    }
                  }}
                  disabled={createTaskBuilder.isPending}
                />
                <Button type="button" onClick={addCriteria} size="sm" variant="outline">
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createTaskBuilder.isPending}>
              {createTaskBuilder.isPending ? 'Construyendo Tarea...' : 'Construir Tarea Avanzada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
