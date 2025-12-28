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
    // If no token, disconnect if connected
    if (!token) {
      if (socket) {
        // console.log('[Socket] Disconnecting socket as token is missing');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If already connected/connecting with same token, skip
    if (socket?.connected && (socket as any).auth?.token === token) {
      return;
    }

    // console.log('[Socket] Initialize connection', API_URL);

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],      // Force WebSocket only
      upgrade: false,                  // Disable transport upgrade
      secure: true,                    // Use secure connection
      autoConnect: true,
      reconnection: true,              // Enable reconnection
      reconnectionAttempts: 5,         // Max retries
      reconnectionDelay: 1000,         // Start with 1s delay
    });

    newSocket.on('connect', () => {
      // console.log('[Socket] ✅ Connected successfully!');
      // console.log('[Socket] Socket ID:', newSocket.id);
      // console.log('[Socket] Transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
      
      // Join user's socket room after connection
      if (user?._id) {
        // console.log('[Socket] Emitting join event for user:', user._id);
        newSocket.emit('join', user._id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      // console.log('[Socket] ❌ Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      // console.error('[Socket] ⚠️ Connection error:', err.message);
      // console.error('[Socket] Error details:', {
      //   message: err.message,
      //   description: (err as any).description,
      //   context: (err as any).context,
      //   type: (err as any).type,
      // });
    });

    // Global listener to acknowledge delivery
    newSocket.on('receive_message', (message) => {
      // If I received it, tell the server I got it (Delivered)
      // We only ack if it wasn't sent by me (though typically receive_message is only for incoming)
      // console.log('[Socket] Global receive_message, acknowledging delivery...', message._id);
      newSocket.emit('mark_delivered', {
        messageId: message._id,
        senderId: message.senderId || (typeof message.sender === 'object' ? message.sender._id : message.sender),
      });
    });

    setSocket(newSocket);

    return () => {
      // console.log('[Socket] Cleanup - Disconnecting');
      newSocket.disconnect();
    };
  }, [token]); // Only depend on token changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
