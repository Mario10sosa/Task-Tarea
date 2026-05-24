import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  type Notification,
} from '@/hooks/useNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}

function typeIcon(type: Notification['type']): string {
  const icons: Record<Notification['type'], string> = {
    invitation:    '📩',
    task_assigned: '👤',
    task_due:      '⏰',
    comment:       '💬',
    status_change: '🔄',
    general:       '🔔',
  };
  return icons[type] ?? '🔔';
}

// ── NotificationItem ──────────────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead     = useMarkAsRead();
  const deleteNotif    = useDeleteNotification();

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
        !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
      }`}
    >
      {/* Icono de tipo */}
      <span className="text-lg shrink-0 mt-0.5">{typeIcon(notification.type)}</span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.read ? 'font-semibold' : 'font-normal'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notification.createdAt)}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={() => markAsRead.mutate(notification._id)}
            title="Marcar como leída"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => deleteNotif.mutate(notification._id)}
          title="Eliminar"
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Indicador de no leída */}
      {!notification.read && (
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
}

// ── NotificationPanel ─────────────────────────────────────────────────────────

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-popover shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unread > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {unread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Leer todas
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Lista con scroll */}
      <ScrollArea className="h-80">
        <div className="p-2">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {notifications.map((n) => (
                <NotificationItem key={n._id} notification={n} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── NotificationBell (componente principal exportado) ─────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera del componente
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}