import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiGetUnreadMessageCount } from '@/utils/api';

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
    const { token } = useAuth();
    const { socket } = useSocket();

    const refreshUnreadCount = async () => {
        if (!token) return;
        try {
            const response = await apiGetUnreadMessageCount(token);
            if (response && typeof response.count === 'number') {
                console.log('[MessageContext] Unread count updated:', response.count);
                setUnreadCount(response.count);
            }
        } catch (error) {
            console.error('[MessageContext] Failed to fetch unread count:', error);
        }
    };

    const incrementUnreadCount = () => {
        setUnreadCount((prev) => {
            console.log('[MessageContext] Incrementing unread count:', prev + 1);
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
    }, [token]);

    // Listen for new messages via socket
    useEffect(() => {
        if (!socket) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleNewMessage = (message: any) => {
            // Basic check: if meaningful content and not sent by me (though socket usually only emits to recipient)
            console.log('[MessageContext] Socket event received: receive_message', message);
            incrementUnreadCount();
        };

        console.log('[MessageContext] Setting up socket listener for receive_message');

        socket.on('receive_message', handleNewMessage);

        return () => {
            socket.off('receive_message', handleNewMessage);
        };
    }, [socket]);

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
