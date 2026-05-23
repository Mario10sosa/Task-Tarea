import type { Task } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useUpdateTask } from '@/hooks/useTasks';
import { useAuth } from '@/store/useAuth';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CheckSquare, 
  Type, 
  AlertCircle,
  Layout,
  Plus,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SubtaskProgress } from '@/components/subtask-progress';
import { TaskDecorations } from '@/components/task-decorations';
import { UndoRedoBar } from '@/components/undo-redo-bar';

interface TaskDetailSheetProps {
  task: Task | null;
  boardId: string;
  columns: any[];
  members: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({ 
  task, 
  boardId, 
  columns,
  members = [], 
  open, 
  onOpenChange 
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [columnId, setColumnId] = useState('');
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [newItem, setNewItem] = useState('');

  const updateTask = useUpdateTask();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setType(task.type || 'simple');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assignedTo || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setDurationMinutes(task.durationMinutes?.toString() || '');
      setColumnId(task.columnId);
      setChecklist(task.checklist || []);
    }
  }, [task, open]);

  const projectMembers = useMemo(() => {
    const allMembers = [...(members || [])];
    if (currentUser) {
      const currentUserId = currentUser.id || (currentUser as any)?._id;
      const alreadyIn = allMembers.some(m => {
        const id = typeof m === 'string' ? m : (m as any)?._id || (m as any)?.id;
        return id === currentUserId;
      });
      if (!alreadyIn && currentUserId) allMembers.unshift(currentUser as any);
    }

    return allMembers.map((member, idx) => {
      const id = (member as any)?._id || (member as any)?.id || (typeof member === 'string' ? member : '');
      const name = (member as any)?.name || (member as any)?.fullName || (member as any)?.user?.name || (member as any)?.user?.fullName || (member as any)?.email || (typeof member === 'string' ? `User (${member.slice(-4)})` : `Member ${idx + 1}`);
      return { id, name };
    });
  }, [members, currentUser]);

  const handleUpdate = async (fields: Partial<any>) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        taskId: task._id,
        boardId,
        payload: fields
      });
    } catch (error) {
      console.error('Failed to update field', error);
    }
  };

  const toggleChecklistItem = (index: number) => {
    const newList = [...checklist];
    newList[index].done = !newList[index].done;
    setChecklist(newList);
    handleUpdate({ checklist: newList });
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    const newList = [...checklist, { text: newItem.trim(), done: false }];
    setChecklist(newList);
    setNewItem('');
    handleUpdate({ checklist: newList });
  };

  const removeChecklistItem = (index: number) => {
    const newList = checklist.filter((_, i) => i !== index);
    setChecklist(newList);
    handleUpdate({ checklist: newList });
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col gap-0 border-l shadow-2xl overflow-hidden h-full">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Layout className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Detalle de Tarea</span>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Badge variant="outline" className="text-[10px] font-bold h-5 px-2 bg-muted/30">
                  {task._id.slice(-6).toUpperCase()}
                </Badge>
              </div>
              
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title !== task.title && handleUpdate({ title })}
                className="text-2xl font-black p-0 h-auto border-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/30 leading-tight"
                placeholder="Título de la tarea..."
              />
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="h-6 px-2 text-[10px] font-extrabold uppercase bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all">
                  {type === 'simple' ? 'Simple' : type === 'checklist' ? 'Checklist' : 'Con Tiempo'}
                </Badge>
                <Badge variant="outline" className={`h-6 px-2 text-[10px] font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-xs ${
                  priority === 'high' || priority === 'urgent' ? 'border-red-500/30 text-red-600 bg-red-50' : 
                  priority === 'medium' ? 'border-blue-500/30 text-blue-600 bg-blue-50' : 'border-gray-500/30 text-gray-500 bg-gray-50'
                }`}>
                  <AlertCircle className="w-3 h-3" />
                  {priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : priority === 'high' ? 'Alta' : 'Urgente'}
                </Badge>
              </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Description & Checklist */}
              <div className="md:col-span-12 space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                    <Type className="w-4 h-4 text-primary" />
                    Descripción
                  </div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => description !== task.description && handleUpdate({ description })}
                    placeholder="Describe esta tarea en detalle..."
                    className="min-h-[120px] bg-muted/20 border-border/50 focus-visible:ring-primary/20 transition-all text-sm leading-relaxed"
                  />
                </div>

                {type === 'checklist' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        Checklist
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                          {checklist.filter(i => i.done).length}/{checklist.length}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 group bg-muted/10 hover:bg-muted/30 p-2.5 rounded-lg border border-transparent hover:border-border/50 transition-all">
                          <button 
                            onClick={() => toggleChecklistItem(idx)}
                            className={`transition-colors ${item.done ? 'text-green-500' : 'text-muted-foreground/40 hover:text-primary'}`}
                          >
                            {item.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <span className={`text-sm flex-1 ${item.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                            {item.text}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeChecklistItem(idx)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="Añadir subtarea..."
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                          className="h-10 text-sm bg-background border-border/60"
                        />
                        <Button onClick={addChecklistItem} size="sm" className="h-10 px-4 bg-primary hover:bg-primary/90 shadow-md">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <SubtaskProgress taskId={task._id} />
            <TaskDecorations taskId={task._id} />

            <Separator className="bg-border/40" />

            <UndoRedoBar taskId={task._id} />

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Asignado
                </Label>
                <Select value={assignedTo} onValueChange={(v) => { setAssignedTo(v); handleUpdate({ assignedTo: v }); }}>
                  <SelectTrigger className="h-10 bg-muted/20 border-border/50">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned_item">Sin asignar</SelectItem>
                    {projectMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px]">{m.name.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{m.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" /> Estado
                </Label>
                <Select value={columnId} onValueChange={(v) => { setColumnId(v); handleUpdate({ columnId: v }); }}>
                  <SelectTrigger className="h-10 bg-muted/20 border-border/50 font-bold text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(c => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Prioridad
                </Label>
                <Select value={priority} onValueChange={(v) => { setPriority(v); handleUpdate({ priority: v }); }}>
                  <SelectTrigger className="h-10 bg-muted/20 border-border/50">
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

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Tipo de Tarea
                </Label>
                <Select value={type} onValueChange={(v) => { setType(v); handleUpdate({ type: v }); }}>
                  <SelectTrigger className="h-10 bg-muted/20 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="checklist">Con Checklist</SelectItem>
                    <SelectItem value="timed">Con Tiempo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'timed' && (
                <>
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Fecha de Entrega
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      onBlur={() => dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '') && handleUpdate({ dueDate })}
                      className="h-10 bg-muted/20 border-border/50"
                    />
                  </div>

                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Duración (Min)
                    </Label>
                    <Input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      onBlur={() => durationMinutes !== task.durationMinutes?.toString() && handleUpdate({ durationMinutes: parseInt(durationMinutes) || 0 })}
                      className="h-10 bg-muted/20 border-border/50"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/5 flex justify-end gap-3">
          <Button variant="ghost" className="text-xs font-bold" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 shadow-lg text-xs font-bold"
            onClick={() => onOpenChange(false)}
          >
            Listo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}