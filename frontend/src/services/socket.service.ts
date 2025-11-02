import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/constants';
import { STORAGE_KEYS } from '../config/constants';

class SocketService {
  private socket: Socket | null = null;

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
      // Only log after socket is fully connected
      setTimeout(() => {
        if (this.socket?.connected) {
          console.log('✅ Socket.io connected:', this.socket.id);
        }
      }, 100);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
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

