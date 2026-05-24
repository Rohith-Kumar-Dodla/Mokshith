import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    // Return a dummy object with no-op functions to prevent crashing
    // while the provider is initializing or if it's accidentally used outside
    return {
      socket: null,
      isConnected: false,
      emit: () => {},
      on: () => () => {}
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    socketInstance = io(SOCKET_URL, {
      auth: {
        token: token,
        userId: user._id || user.id
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      socketInstance.emit('join', user._id || user.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socketInstance.connect();
      }
    });

    socketInstance.on('reconnect_attempt', (attempt) => {
      // Reconnection in progress
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('reconnect_attempt');
        socketInstance.off('reconnect_failed');
        socketInstance.off('connect_error');
        socketInstance.disconnect();
      }
    };
  }, [user?._id, user?.id, token]);

  const emit = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, [socket]);

  const on = useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);
    }
    return () => {
      if (socket) {
        socket.off(event, handler);
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on }}>
      {children}
    </SocketContext.Provider>
  );
};
