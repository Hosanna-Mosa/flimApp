import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { api } from '@/utils/api';

interface MessageContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    incrementUnreadCount: () => void;
    decrementUnreadCount: () => void;
    resetUnreadCount: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { token, user } = useAuth();
    const { socket } = useSocket();

    const refreshUnreadCount = async () => {
        if (!token) return;
    try {
      const data: any = await api.getUnreadMessageCount(token);
      if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch {
        }
    };

    const incrementUnreadCount = () => {
        setUnreadCount((prev) => {
            return prev + 1;
        });
    };

    const decrementUnreadCount = () => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const resetUnreadCount = () => {
        setUnreadCount(0);
    };

    // Load initial count when token is available
    useEffect(() => {
        if (token) {
            refreshUnreadCount();
            // Poll every 5 seconds as fallback (was 60s)
            const interval = setInterval(refreshUnreadCount, 5000);
            return () => clearInterval(interval);
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only subscription; refreshUnreadCount identity is unstable
    }, [token]);

    // Listen for new messages via socket
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: any) => {
            // Only count messages sent by someone else. The socket normally
            // only emits to the recipient, but guard against echoes of my
            // own messages.
            const senderId =
                message?.senderId ||
                (typeof message?.sender === 'object' ? message.sender?._id : message?.sender);
            const myId = user?._id || user?.id;
            if (myId && senderId && String(senderId) === String(myId)) return;
            incrementUnreadCount();
        };


        socket.on('receive_message', handleNewMessage);

        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [socket, user]);

    return (
        <MessageContext.Provider
            value={{
                unreadCount,
                refreshUnreadCount,
                incrementUnreadCount,
                decrementUnreadCount,
                resetUnreadCount,
            }}
        >
            {children}
        </MessageContext.Provider>
    );
};

export const useMessages = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessages must be used within MessageProvider');
    }
    return context;
};
