import { useState, useEffect } from 'react';
import { useUpdateProject, useDeleteProject, useCloneProject } from '@/hooks/useProjects';
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
import { Settings2, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '@/lib/types';

export function ProjectSettingsDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const cloneProject = useCloneProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || '');
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await updateProject.mutateAsync({
        id: project._id,
        payload: {
          name: name.trim(),
          description: description.trim(),
        }
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to update project', error);
    }
  };

  const handleClone = async () => {
    try {
      const newProject = await cloneProject.mutateAsync(project._id);
      setOpen(false);
      navigate(`/projects/${newProject._id}`);
    } catch (error) {
      console.error('Failed to clone project', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteProject.mutateAsync(project._id);
      setOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuración del Proyecto</DialogTitle>
          <DialogDescription>
            Modifica los detalles del proyecto o elimínalo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Nombre del Proyecto</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateProject.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project-description">Descripción</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateProject.isPending}
              className="resize-none h-24"
            />
          </div>
          
          <div className="pt-4 border-t flex flex-col gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Acciones</h4>
              <p className="text-xs text-muted-foreground">Clona este proyecto con todos sus tableros y tareas.</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleClone}
              disabled={cloneProject.isPending}
            >
              <Copy className="w-4 h-4 mr-2" />
              {cloneProject.isPending ? 'Clonando...' : 'Clonar Proyecto'}
            </Button>
          </div>

          <div className="pt-4 border-t flex flex-col gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-destructive">Zona de Peligro</h4>
              <p className="text-xs text-muted-foreground">Una vez que elimines un proyecto, no hay vuelta atrás. Por favor, asegúrate.</p>
            </div>
            <Button 
              type="button" 
              variant="destructive" 
              className="w-full" 
              onClick={handleDelete}
              disabled={deleteProject.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Proyecto
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
