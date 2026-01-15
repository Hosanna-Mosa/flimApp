import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

/**
 * ------------------------------------------------------
 *  Socket Instance (SINGLE SOURCE OF TRUTH)
 * ------------------------------------------------------
 */
// Get API URL ONLY from environment variable (.env file)
const SOCKET_URL = ((globalThis as any)?.process?.env?.EXPO_PUBLIC_API_URL as string) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:4000';

console.log('[SOCKET] Connecting to:', SOCKET_URL);

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  transports: ['websocket'],
  reconnection: true,
  timeout: 20000,
  autoConnect: false, // 🔴 IMPORTANT: connect ONLY after token exists
});

/**
 * ------------------------------------------------------
 *  Context Types
 * ------------------------------------------------------
 */
interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

/**
 * ------------------------------------------------------
 *  Socket Provider
 * ------------------------------------------------------
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  /**
   * --------------------------------------------------
   *  CONNECT SOCKET WHEN TOKEN IS AVAILABLE
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!token) {
      // No token → ensure socket is disconnected
      if (socket.connected) {
        socket.disconnect();
      }
      setIsConnected(false);
      return;
    }

    // Attach JWT BEFORE connecting
    socket.auth = { token };

    // Connect only once (controlled)
    if (!socket.connected) {
      console.log('[SOCKET] Connecting with token...');
      socket.connect();
    }
  }, [token]);

  /**
   * --------------------------------------------------
   *  SOCKET EVENT LISTENERS
   * --------------------------------------------------
   */
  useEffect(() => {
    const onConnect = () => {
      console.log('[SOCKET] connected:', socket.id);
      setIsConnected(true);

      // Join user room after connect
      if (user?._id) {
        socket.emit('join', user._id);
      }
    };

    const onDisconnect = (reason: string) => {
      console.log('[SOCKET] disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.log('[SOCKET] connect_error:', err.message);
    };

    const onReceiveMessage = (message: any) => {
      // Acknowledge delivery
      socket.emit('mark_delivered', {
        messageId: message._id,
        senderId:
          message.senderId ||
          (typeof message.sender === 'object'
            ? message.sender._id
            : message.sender),
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceiveMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceiveMessage);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
