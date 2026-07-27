import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function resolveSocketUrl() {
  const configuredApi = import.meta.env.VITE_API_BASE_URL;
  const runtimeBackendUrl = typeof window !== 'undefined' ? window.__BACKEND_URL__ : undefined;
  const apiBase = configuredApi || runtimeBackendUrl || (import.meta.env.PROD ? '' : 'http://localhost:5000/api/v1');
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

let sharedSocket = null;

function getSocket() {
  if (sharedSocket) return sharedSocket;
  const url = resolveSocketUrl();
  if (!url) return null;

  sharedSocket = io(url, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
  });

  return sharedSocket;
}

export function useOrderStatusSync(onStatusUpdated) {
  const handlerRef = useRef(onStatusUpdated);
  handlerRef.current = onStatusUpdated;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handleUpdate = (event) => {
      if (!event?.orderId) return;
      handlerRef.current?.(event);
    };

    socket.on('order:statusUpdated', handleUpdate);
    socket.on('delivery:statusUpdated', handleUpdate);

    return () => {
      socket.off('order:statusUpdated', handleUpdate);
      socket.off('delivery:statusUpdated', handleUpdate);
    };
  }, []);
}

export default useOrderStatusSync;
