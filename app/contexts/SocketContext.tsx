import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();
  
  // Use same API URL logic as utils/api.ts
  const API_URL =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) ||
    'http://10.212.182.150:8000';

  useEffect(() => {
    if (!token || !user) {
        if (socket) {
            console.log('[Socket] Disconnecting socket as user logged out');
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
        return;
    }

    if (socket?.connected) {
        return; 
    }

    console.log('[Socket] Initialize connection', API_URL);

    const newSocket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
    });

    newSocket.on('connect', () => {
        console.log('[Socket] Connected:', newSocket.id);
        setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
        setIsConnected(false);
    });
    
    newSocket.on('connect_error', (err) => {
        console.log('[Socket] Connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
        console.log('[Socket] Cleanup');
        newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
