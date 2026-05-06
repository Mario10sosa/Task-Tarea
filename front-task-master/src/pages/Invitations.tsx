import { useUserInvitations, useAcceptInvitation, useRejectInvitation } from '@/hooks/useInvitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function InvitationsPage() {
  const { data: invitations, isLoading } = useUserInvitations();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const queryClient = useQueryClient();

  const handleAccept = async (token: string) => {
    try {
      await acceptInvitation.mutateAsync(token);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (err) {
      console.error('Failed to accept invitation', err);
    }
  };

  const handleReject = async (token: string) => {
    try {
      await rejectInvitation.mutateAsync(token);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    } catch (err) {
      console.error('Failed to reject invitation', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-muted/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Invitaciones de Proyectos</h1>
            <p className="text-muted-foreground">Gestiona tus colaboraciones y únete a nuevos equipos.</p>
          </div>
        </div>

        {(!invitations || invitations.filter((i: any) => i.status === 'pending').length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 bg-background rounded-3xl border border-dashed shadow-sm text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold">No hay invitaciones pendientes</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              No tienes invitaciones a proyectos pendientes en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {invitations
              .filter((inv: any) => inv.status === 'pending')
              .map((inv: any) => (
                <Card key={inv._id} className="overflow-hidden border-border/40 shadow-md hover:shadow-lg transition-all group">
                  <div className="h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider mb-1 bg-primary/5 text-primary border-primary/20">
                          Nueva Invitación
                        </Badge>
                        <CardTitle className="text-xl font-bold">{inv.projectId?.name || 'Proyecto Desconocido'}</CardTitle>
                      </div>
                      <div className="p-2 bg-muted rounded-lg group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-2 pt-1 font-medium">
                      <span>Invitado por <span className="text-foreground">{inv.invitedBy?.name || 'Alguien'}</span></span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      <Clock className="w-3 h-3" />
                      <span>Recibida el {new Date(inv.createdAt || inv.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3 bg-muted/20 border-t border-border/10 mt-auto">
                    <Button 
                      variant="ghost" 
                      className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold text-xs uppercase"
                      onClick={() => handleReject(inv.token)}
                      disabled={rejectInvitation.isPending || acceptInvitation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 shadow-md hover:shadow-primary/20 font-bold text-xs uppercase"
                      onClick={() => handleAccept(inv.token)}
                      disabled={acceptInvitation.isPending || rejectInvitation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {acceptInvitation.isPending ? 'Uniéndose...' : 'Unirse al Proyecto'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
