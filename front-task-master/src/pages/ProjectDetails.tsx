import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProjects';
import { useBoards } from '@/hooks/useBoards';
import { useTasks } from '@/hooks/useTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, GripVertical, MoreVertical, Trash2, Edit2, Copy, AlertCircle, Box, Bookmark, Clock } from 'lucide-react';import type { Task, Column } from '@/lib/types';
import { CreateBoardDialog } from '@/components/create-board-dialog';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { ProjectSettingsDialog } from '@/components/project-settings-dialog';

import { InviteUserDialog } from '@/components/invite-user-dialog';
import { AdvancedTaskDialog } from '@/components/advanced-task-dialog';
import { MemberManagementDialog } from '@/components/member-management-dialog';
import { TaskDetailSheet } from '@/components/task-detail-sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMoveTask, useUpdateTask, useDeleteTask, useCloneTask } from '@/hooks/useTasks';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { ReportDownloadButton } from '@/components/report-download-button';
import { ProjectDashboard } from '@/components/project-dashboard';
import { TaskIteratorView } from '@/components/task-iterator-view';
import { TaskSortStrategy } from '@/components/task-sort-strategy';
import { TaskEventFeed } from '@/components/task-event-feed';
import { MediatorEventBus } from '@/components/mediator-event-bus';

export function ProjectDetailsPage() {
  const { id: projectId } = useParams();
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: boards, isLoading: isLoadingBoards } = useBoards(projectId);

  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  // Set initial active board
  if (boards && boards.length > 0 && !activeBoardId) {
    setActiveBoardId(boards[0]._id);
  }

  if (isLoadingProject || isLoadingBoards) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-[400px] w-full mt-4" />
      </div>
    );
  }

  if (!project) {
    return <div>Proyecto no encontrado</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4 h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            {project.members && project.members.length > 0 && (
              <MemberManagementDialog project={project} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <InviteUserDialog projectId={projectId || ''} />
           <ProjectSettingsDialog project={project} />
           <ReportDownloadButton
             projectId={project._id}
             projectName={project.name}
           />
        </div>
      </div>

      {boards && boards.length > 0 ? (
        <Tabs
          value={activeBoardId || ''}
          onValueChange={setActiveBoardId}
          className="flex-1 flex flex-col"
        >
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Dashboard
              </TabsTrigger>
              {boards.map((board) => (
                <TabsTrigger key={board._id} value={board._id} className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  {board.name}
                </TabsTrigger>
              ))}
              <TabsTrigger value="sort" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Ordenar
              </TabsTrigger>
              <TabsTrigger value="iterate" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Iterar
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Actividad
              </TabsTrigger>
              <TabsTrigger value="mediator" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Event Bus
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <CreateBoardDialog projectId={projectId || ''}>
                <Button variant="outline" size="sm" className="h-9 px-3">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nuevo Tablero
                </Button>
              </CreateBoardDialog>
            </div>
          </div>

          {boards.map((board) => (
             <TabsContent
               key={board._id}
               value={board._id}
               className="flex-1 mt-4 outline-none h-full"
             >
               <BoardView 
                 boardId={board._id} 
                 projectId={projectId || ''} 
                 columns={board.columns}
                 members={project.members as any[]} 
               />
             </TabsContent>
          ))}
          <TabsContent value="dashboard" className="flex-1 mt-4 outline-none">
            <ProjectDashboard projectId={project._id} />
          </TabsContent>

          {/* Strategy — Ordenamiento de tareas */}
          <TabsContent value="sort" className="flex-1 mt-4 outline-none">
            <div className="flex flex-col gap-4 p-2">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-foreground/80">Ordenar tareas del proyecto</h2>
                <TaskSortStrategy projectId={project._id} />
              </div>
            </div>
          </TabsContent>

          {/* Iterator — Recorrer colecciones */}
          <TabsContent value="iterate" className="flex-1 mt-4 outline-none">
            <TaskIteratorView projectId={project._id} />
          </TabsContent>

          {/* Observer — Feed de actividad */}
          <TabsContent value="activity" className="flex-1 mt-4 outline-none">
            <div className="p-2">
              <h2 className="text-sm font-semibold text-foreground/80 mb-4">Actividad del proyecto</h2>
              <TaskEventFeed />
            </div>
          </TabsContent>

          {/* Mediator — TaskEventBus */}
          <TabsContent value="mediator" className="flex-1 mt-4 outline-none">
            <div className="p-2">
              <MediatorEventBus />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed rounded-xl bg-muted/20">
          <h3 className="text-lg font-medium">No se encontraron tableros</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">Todo comienza con un plan. Crea tu primer tablero Kanban para empezar a organizar tu trabajo.</p>
          <CreateBoardDialog projectId={projectId || ''}>
            <Button className="shadow-sm">Crear Primer Tablero</Button>
          </CreateBoardDialog>
        </div>
      )}
    </div>
  );
}

function BoardView({ 
  boardId, 
  projectId, 
  columns,
  members 
}: { 
  boardId: string, 
  projectId: string, 
  columns: Column[],
  members: any[]
}) {
  const { data: tasks, isLoading } = useTasks(boardId);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const moveTask = useMoveTask();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsSheetOpen(true);
  };

  // Sync localTasks with server data
  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-[600px] w-[350px] rounded-xl" />
        <Skeleton className="h-[600px] w-[350px] rounded-xl" />
        <Skeleton className="h-[600px] w-[350px] rounded-xl" />
      </div>
    );
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update local state immediately for zero-flicker UI
    const updatedTasks = localTasks.map((t) =>
      t._id === draggableId ? { ...t, columnId: destination.droppableId } : t
    );
    setLocalTasks(updatedTasks);

    // Call mutation to update backend
    moveTask.mutate({
      taskId: draggableId,
      columnId: destination.droppableId,
      boardId,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2 h-[calc(100vh-260px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        {columns.map((column) => {
          const columnId = column.id || column.name;
          const columnTasks = localTasks.filter((t) => t.columnId === columnId);

          return (
            <Droppable key={columnId} droppableId={columnId}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex flex-col w-[280px] min-w-[280px] shrink-0 rounded-xl bg-muted/30 border border-border/40 transition-all duration-200 ${
                    snapshot.isDraggingOver ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground/80 tracking-tight">{column.name}</h3>
                      <Badge variant="secondary" className="px-1.5 h-4.5 text-[10px] bg-muted/80 text-muted-foreground">
                        {columnTasks.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-0 px-3 pb-3 scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent">
                    {columnTasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${snapshot.isDragging ? 'z-50 shadow-2xl' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <TaskCard 
                              task={task} 
                              columns={columns} 
                              boardId={boardId} 
                              dragHandleProps={provided.dragHandleProps} 
                              members={members}
                              onClick={() => handleTaskClick(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    <div className="mt-2 space-y-1">
                      <CreateTaskDialog projectId={projectId} boardId={boardId} columnId={columnId}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground/60 hover:text-primary hover:bg-primary/5 border border-dashed border-transparent hover:border-primary/20 transition-all font-normal h-9"
                        >
                          <PlusIcon className="w-3.5 h-3.5 mr-2" />
                          Añadir Tarea
                        </Button>
                      </CreateTaskDialog>
                      <AdvancedTaskDialog 
                        projectId={projectId} 
                        boardId={boardId} 
                        columnId={columnId}
                        members={members}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
        {/* Placeholder for empty space to allow scrolling */}
        <div className="w-8 shrink-0" />
      </div>

      <TaskDetailSheet
        task={selectedTask}
        boardId={boardId}
        columns={columns}
        members={members}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </DragDropContext>
  );
}

function TaskCard({ 
  task, 
  columns, 
  boardId, 
  dragHandleProps,
  members = [],
  onClick
}: { 
  task: Task; 
  columns: Column[]; 
  boardId: string;
  dragHandleProps: any;
  members?: any[];
  onClick?: () => void;
}) {
  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const cloneTask = useCloneTask();

  const handleMove = (newColumn: string) => {
    moveTask.mutate({ taskId: task._id, columnId: newColumn, boardId });
  };

  const toggleChecklistItem = (index: number) => {
    if (!task.checklist) return;
    const newChecklist = [...task.checklist];
    newChecklist[index] = { ...newChecklist[index], done: !newChecklist[index].done };
    updateTask.mutate({ taskId: task._id, payload: { checklist: newChecklist }, boardId });
  };

  const priorityConfig = {
    low: { label: 'Baja', color: 'bg-blue-500/10 text-blue-600 border-blue-200/50', icon: <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> },
    medium: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200/50', icon: <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> },
    high: { label: 'Alta', color: 'bg-orange-500/10 text-orange-600 border-orange-200/50', icon: <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> },
    urgent: { label: 'Urgente', color: 'bg-red-500/10 text-red-600 border-red-200/50 font-bold', icon: <AlertCircle className="w-3 h-3 text-red-500" /> },
  };

  const typeConfig = {
    simple: { icon: <Bookmark className="w-3 h-3 text-green-500" />, label: 'Simple', color: 'text-green-500' },
    checklist: { icon: <Box className="w-3 h-3 text-blue-500" />, label: 'Checklist', color: 'text-blue-500' },
    timed: { icon: <Clock className="w-3 h-3 text-purple-500" />, label: 'Con Tiempo', color: 'text-purple-500' },
  };

  // Calculate checklist progress
  const doneCount = task.checklist?.filter((c) => c.done).length || 0;
  const totalCount = task.checklist?.length || 0;
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 border border-border bg-card group/card select-none overflow-hidden rounded-xl border-t-2 border-t-transparent hover:border-t-primary/40 cursor-pointer active:scale-[0.98] mx-0.5"
      onClick={(e) => {
        // Prevent opening the sheet if clicking internal buttons or drag handle
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-drag-handle]')) {
          return;
        }
        onClick?.();
      }}
    >
      <CardHeader className="p-3 pb-1.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Left side: Drag handle and Meta Info */}
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <div 
              {...dragHandleProps} 
              data-drag-handle="true"
              className="p-1 mt-0.5 hover:bg-muted rounded cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {task.type && typeConfig[task.type as keyof typeof typeConfig] && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 rounded-md shrink-0">
                    {typeConfig[task.type as keyof typeof typeConfig].icon}
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${typeConfig[task.type as keyof typeof typeConfig].color}`}>
                      {typeConfig[task.type as keyof typeof typeConfig].label}
                    </span>
                  </div>
                )}
                {task.priority && priorityConfig[task.priority as keyof typeof priorityConfig] && (
                  <Badge 
                    variant="outline" 
                    className={`h-4.5 px-1.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}
                  >
                    {priorityConfig[task.priority as keyof typeof priorityConfig].icon}
                    {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side: Assignee and Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {task.assignedTo && (
               <div className="mr-0.5">
                 {(() => {
                    const assignee = members.find(m => {
                      const id = typeof m === 'string' ? m : m?._id || m?.id;
                      return id === task.assignedTo;
                    });
                    const name = assignee?.name || assignee?.fullName || (typeof assignee === 'string' ? assignee : '');
                    const initials = name?.substring(0, 2).toUpperCase() || '?';
                    return (
                      <div className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 bg-primary/5 rounded-full border border-primary/10 group/assignee relative">
                        <Avatar className="h-4 w-4 rounded-full border border-background">
                          <AvatarFallback className="text-[7px] font-black bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        {name && <span className="text-[9px] font-bold text-primary/80 truncate max-w-[50px]">{name}</span>}
                      </div>
                    );
                 })()}
               </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground/50 hover:text-foreground">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 p-1">
                <DropdownMenuItem 
                  className="text-xs rounded-md"
                  onClick={() => onClick?.()}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-2 text-primary" />
                  Editar Detalles
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs rounded-md"
                  onClick={() => cloneTask.mutate({ 
                    taskId: task._id, 
                    boardId: boardId || task.boardId, 
                    columnId: task.columnId 
                  })}
                >
                  <Copy className="w-3.5 h-3.5 mr-2 text-blue-500" />
                  Clonar Tarea
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs rounded-md text-destructive focus:text-destructive focus:bg-destructive/5"
                  onClick={() => deleteTask.mutate({ taskId: task._id, boardId })}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar permanentemente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardTitle className="text-[13px] font-bold leading-snug text-foreground/90 group-hover/card:text-primary transition-colors">
          {task.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 space-y-3">
        {task.description && (
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 italic">
            {task.description}
          </p>
        )}

        {totalCount > 0 && (
          <div className="space-y-1.5 bg-muted/20 p-2 rounded-lg border border-border/40">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
              <span>Lista de Tareas</span>
              <span>{doneCount}/{totalCount}</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-primary/60'}`} 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            {task.checklist && task.checklist.length > 0 && (
              <ul className="space-y-1 mt-1.5">
                {task.checklist.slice(0, 2).map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] group/item">
                    <button
                      onClick={() => toggleChecklistItem(i)}
                      className={`w-3 h-3 rounded-[3px] border transition-all flex items-center justify-center shrink-0 ${
                        item.done 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-muted-foreground/30 hover:border-primary/50'
                      }`}
                    >
                      {item.done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className={`leading-tight truncate ${item.done ? 'text-muted-foreground/40 line-through' : 'text-muted-foreground/80'}`}>
                      {item.text}
                    </span>
                  </li>
                ))}
                {task.checklist.length > 2 && (
                  <li className="text-[9px] text-muted-foreground/40 font-medium pl-5 pt-0.5">
                    + {task.checklist.length - 2} elementos más...
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            {task.storyPoints && (
              <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-black bg-primary/5 text-primary border-primary/10 rounded-md">
                {task.storyPoints}
              </Badge>
            )}
            
            {(task.tags && task.tags.length > 0) && (
              <div className="flex gap-1">
                {task.tags.slice(0, 1).map(tag => (
                   <span key={tag} className="text-[9px] text-muted-foreground hover:text-primary cursor-default whitespace-nowrap">#{tag}</span>
                ))}
                {task.tags.length > 1 && <span className="text-[9px] text-muted-foreground/50">+{task.tags.length - 1}</span>}
              </div>
            )}

            {task.dueDate && (
              <span className={`text-[9px] font-medium flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md ${
                new Date(task.dueDate) < new Date() ? 'bg-red-500/10 text-red-600' : 'text-muted-foreground'
              }`}>
                <Clock className="w-2.5 h-2.5" />
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <Select value={task.columnId} onValueChange={handleMove}>
            <SelectTrigger className="w-[80px] h-5 px-1 bg-transparent border-none text-[9px] font-bold text-muted-foreground/50 hover:text-primary transition-all transition-shadow focus:ring-0 uppercase tracking-tighter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="p-0 overflow-hidden min-w-[120px]">
              {columns.map((col) => (
                <SelectItem key={col._id || col.id} value={col.id || col.name} className="text-[10px] py-1.5">
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}