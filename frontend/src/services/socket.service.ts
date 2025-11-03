import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants';
import { STORAGE_KEYS } from '../config/constants';

class SocketService {
  private socket: Socket | null = null;
  private connectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // Remove /v1 from API_BASE_URL for Socket.io connection
    const socketUrl = API_BASE_URL.replace('/v1', '');
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      // Clear any existing timeout
      if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        this.connectTimeoutId = null;
      }

      // Only log after socket is fully connected (in development)
      if (import.meta.env.DEV) {
        this.connectTimeoutId = setTimeout(() => {
          if (this.socket?.connected) {
            console.log('✅ Socket.io connected:', this.socket.id);
          }
          this.connectTimeoutId = null;
        }, 100);
      }
    });

    this.socket.on('disconnect', () => {
      // Clear timeout on disconnect
      if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        this.connectTimeoutId = null;
      }
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('❌ Socket.io disconnected');
      }
    });

    this.socket.on('connect_error', (error) => {
      // Clear timeout on error
      if (this.connectTimeoutId) {
        clearTimeout(this.connectTimeoutId);
        this.connectTimeoutId = null;
      }
      
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('Socket.io connection error:', error);
      }
    });

    return this.socket;
  }

  disconnect() {
    // Clear any pending timeout
    if (this.connectTimeoutId) {
      clearTimeout(this.connectTimeoutId);
      this.connectTimeoutId = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

