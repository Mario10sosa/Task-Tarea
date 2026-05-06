import { useState } from 'react';
import { useRemoveMember } from '@/hooks/useProjects';
import { usePendingInvitations } from '@/hooks/useInvitations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Shield, Users, Mail, Clock as ClockIcon, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Invitation {
  _id: string;
  invitedEmail: string;
  status: string;
  createdAt?: string;
  expiresAt?: string;
}

export function MemberManagementDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const removeMember = useRemoveMember();
  const { data: invitations } = usePendingInvitations(project._id);

  const handleRemove = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este miembro del proyecto?')) {
      return;
    }

    try {
      await removeMember.mutateAsync({ projectId: project._id, userId });
    } catch (error) {
      console.error('Failed to remove member', error);
    }
  };

  // Type cast members if they are objects
  const members = project.members as unknown as Member[];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex -space-x-2 ml-4 cursor-pointer hover:opacity-80 transition-opacity">
          {members.slice(0, 5).map((member) => (
            <Avatar key={member._id} className="w-8 h-8 border-2 border-background ring-1 ring-border shadow-sm">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary uppercase">
                {member.name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground ring-1 ring-border">
              +{members.length - 5}
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="h-1.5 bg-primary w-full" />
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Colaboración del Proyecto</DialogTitle>
          </div>
          <DialogDescription>
            Gestiona los miembros activos y rastrea las invitaciones pendientes.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="members" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
                Miembros Activos ({members.length})
              </TabsTrigger>
              <TabsTrigger value="invitations" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
                Invitaciones ({invitations?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="members" className="mt-0 focus-visible:outline-none">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4 bg-muted/30 p-3 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg border shadow-sm text-primary">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold leading-none">Gestión de Acceso</p>
                    <p className="text-[11px] text-muted-foreground">Solo los propietarios pueden eliminar miembros.</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px]">
                  Configurado
                </Badge>
              </div>

              <ScrollArea className="h-[280px] pr-4 -mr-4">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div 
                      key={member._id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 border border-border/40 shadow-sm">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                            {member.name?.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold truncate text-foreground/90">{member.name}</span>
                          <span className="text-[11px] text-muted-foreground truncate">{member.email}</span>
                        </div>
                      </div>
                      
                      {member._id !== project.ownerId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                          onClick={() => handleRemove(member._id)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {member._id === project.ownerId && (
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter font-black bg-muted/50 text-muted-foreground border-border/40 px-1.5 h-5">
                          Propietario
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="mt-0 focus-visible:outline-none">
            <div className="px-6 py-4">
              {(!invitations || invitations.length === 0) ? (
                <div className="h-[320px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                  <div className="p-3 bg-muted rounded-full mb-3">
                    <Mail className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <h4 className="text-sm font-bold text-muted-foreground">No hay invitaciones pendientes</h4>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-[180px]">Cuando invites a alguien por correo, aparecerá aquí hasta que acepte.</p>
                </div>
              ) : (
                <ScrollArea className="h-[320px] pr-4 -mr-4">
                  <div className="space-y-3">
                    {invitations.map((inv: Invitation) => (
                      <div 
                        key={inv._id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                            <UserPlus className="w-5 h-5 text-primary/60" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold truncate text-foreground/90">{inv.invitedEmail}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              Enviada el {new Date(inv.createdAt || inv.expiresAt || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[8px] uppercase tracking-widest bg-yellow-500/10 text-yellow-600 border-yellow-200/50">
                          Pendiente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-6 bg-muted/20 border-t border-border/40 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-4 font-bold text-xs uppercase tracking-wider">
            Cerrar Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
