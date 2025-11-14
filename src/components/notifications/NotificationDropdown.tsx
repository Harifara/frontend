// src/components/notifications/NotificationDropdown.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: string;
}

export const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    // 🔔 Optionnel : rafraîchir périodiquement
    // const interval = setInterval(fetchNotifications, 30000);
    // return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data: any[] = await authApi.getAuditLogs(); // ⚡ Utilise ton API DRF/Kong
      const mapped = data.map((item: any) => ({
        id: item.id,
        title: item.action || "Notification",
        message: item.detail || "",
        type: item.level === 'warning' ? 'warning' : item.level === 'error' ? 'error' : 'info',
        read: item.read || false,
        createdAt: item.created_at || new Date().toISOString(),
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } catch (err: any) {
      console.error("Erreur lors du fetch notifications:", err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les notifications",
        variant: "destructive",
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // 🔹 Optionnel : Appeler ton API backend pour marquer comme lu
    // authApi.markNotificationAsRead(notificationId);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    // 🔹 Optionnel : marquer toutes les notifications comme lues côté backend
    // notifications.forEach(n => {
    //   if (!n.read) authApi.markNotificationAsRead(n.id);
    // });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={markAllAsRead}>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start space-x-3 p-3 cursor-pointer"
                onClick={() => markAsRead(notification.id)}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                {!notification.read && <div className="w-2 h-2 bg-primary rounded-full mt-1" />}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-primary cursor-pointer"
              onClick={() => toast({ title: "Fonctionnalité", description: "Voir toutes les notifications" })}
            >
              Voir toutes les notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
