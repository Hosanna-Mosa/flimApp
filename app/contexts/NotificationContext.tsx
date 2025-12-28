import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiNotifications } from '@/utils/api';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const { socket } = useSocket();

  const refreshUnreadCount = async () => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await apiNotifications(token);
      if (Array.isArray(data)) {
        // Show only unread notifications count
        const count = data.filter((n: any) => !n.isRead).length;
        // console.log('[NotificationContext] Unread count updated:', count);
        setUnreadCount(count);
      }
    } catch (error) {
      // console.error('[NotificationContext] Failed to fetch unread count:', error);
    }
  };

  const incrementUnreadCount = () => {
    setUnreadCount((prev) => {
      // console.log('[NotificationContext] Incrementing unread count:', prev + 1);
      return prev + 1;
    });
  };

  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // Load initial count when token is available and socket connects
  useEffect(() => {
    if (token) {
      refreshUnreadCount();
      // Poll every 5 seconds as fallback
      const interval = setInterval(refreshUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      // console.log('[NotificationContext] Received new notification:', data);
      incrementUnreadCount();
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
