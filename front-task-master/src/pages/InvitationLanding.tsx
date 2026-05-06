import { useParams, useNavigate } from 'react-router-dom';
import { useInvitation, useAcceptInvitation, useRejectInvitation } from '@/hooks/useInvitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, MailOpen } from 'lucide-react';

export function InvitationLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data: invitation, isLoading, error } = useInvitation(token);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  const handleAccept = async () => {
    if (!token) return;
    try {
      await acceptInvitation.mutateAsync(token);
      navigate('/');
    } catch (err) {
      console.error('Failed to accept invitation', err);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      await rejectInvitation.mutateAsync(token);
      navigate('/');
    } catch (err) {
      console.error('Failed to reject invitation', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
        <Skeleton className="w-full max-w-[450px] h-[300px] rounded-xl" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
        <Card className="w-full max-w-[450px] border-destructive/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/')}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-[450px] shadow-xl border-border/50 overflow-hidden">
        <div className="h-2 bg-primary" />
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <MailOpen className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Project Invitation</CardTitle>
          <CardDescription className="text-base mt-2">
            You've been invited to collaborate.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border/40 inline-block w-full">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Project</p>
            <p className="text-xl font-bold text-foreground">{invitation.projectName}</p>
            <p className="text-sm text-muted-foreground mt-2 italic">
              Invited by: <span className="font-semibold text-foreground/80">{invitation.inviterName}</span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground px-4">
            By accepting, you will have access to all boards and tasks within this project.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive" 
            onClick={handleReject}
            disabled={rejectInvitation.isPending || acceptInvitation.isPending}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90" 
            onClick={handleAccept}
            disabled={acceptInvitation.isPending || rejectInvitation.isPending}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {acceptInvitation.isPending ? 'Accepting...' : 'Accept'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
