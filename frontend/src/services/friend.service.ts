import api from './api';
import { socketService } from './socket.service';

// Helper function to create a Promise with timeout cleanup
function createSocketPromiseWithTimeout<T>(
  socket: ReturnType<typeof socketService.getSocket>,
  emitEvent: string,
  emitData: unknown,
  successEvent: string,
  errorEvent: string,
  timeoutMs = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not available'));
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const handleSuccess = (data: T) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      resolve(data);
    };

    const handleError = (error: { message?: string }) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      reject(new Error(error.message || 'Request failed'));
    };

    // Set timeout
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      reject(new Error('Request timeout'));
    }, timeoutMs);

    // Register event listeners
    socket.once(successEvent, handleSuccess);
    socket.once(errorEvent, handleError);

    // Emit request
    socket.emit(emitEvent, emitData);
  });
}

export interface FriendRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: number;
  userId: number;
  friendId: number;
  friendName: string;
  friendEmail: string;
  createdAt: string;
}

export const friendService = {
  async sendFriendRequest(toUserId: number): Promise<FriendRequest> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return createSocketPromiseWithTimeout<FriendRequest>(
        socket,
        'friend:send_request',
        { toUserId },
        'friend:request_sent',
        'friend:error',
        10000
      );
    }
    
    // Fallback to REST
    const response = await api.post<FriendRequest>('/friends/request', { toUserId });
    return response.data;
  },

  async acceptFriendRequest(requestId: number): Promise<FriendRequest> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      const result = await createSocketPromiseWithTimeout<{ requestId?: number } & FriendRequest>(
        socket,
        'friend:accept_request',
        { requestId },
        'friend:request_accepted',
        'friend:error',
        10000
      );
      // Backend returns FriendRequest, create a minimal one if needed
      return { id: result.requestId || result.id || requestId, status: 'accepted', ...result } as FriendRequest;
    }
    
    const response = await api.post<FriendRequest>(`/friends/accept/${requestId}`);
    return response.data;
  },

  async rejectFriendRequest(requestId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      await createSocketPromiseWithTimeout<void>(
        socket,
        'friend:reject_request',
        { requestId },
        'friend:request_rejected',
        'friend:error',
        10000
      );
    } else {
      await api.post(`/friends/reject/${requestId}`);
    }
  },

  async getFriends(): Promise<Friend[]> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return createSocketPromiseWithTimeout<Friend[]>(
        socket,
        'friend:get_friends',
        undefined,
        'friend:friends',
        'friend:error',
        10000
      );
    }
    
    const response = await api.get<Friend[]>('/friends');
    return response.data;
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    // This endpoint might not be used anymore, but keep for compatibility
    const response = await api.get<FriendRequest[]>('/friends/requests');
    return response.data;
  },

  async getAllFriendRequests(): Promise<{
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  }> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return createSocketPromiseWithTimeout<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>(
        socket,
        'friend:get_requests',
        undefined,
        'friend:requests',
        'friend:error',
        10000
      );
    }
    
    const response = await api.get<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends/requests/all');
    return response.data;
  },

  async areFriends(_userId1: number, userId2: number): Promise<boolean> {
    const response = await api.get<boolean>(`/friends/check/${userId2}`);
    return response.data;
  },

  async getFriendRequestStatus(toUserId: number): Promise<{
    status: 'friends' | 'request_sent' | 'request_received' | 'not_friends';
    request?: FriendRequest;
    friendship?: Friend;
  }> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return createSocketPromiseWithTimeout<{
        status: 'friends' | 'request_sent' | 'request_received' | 'not_friends';
        request?: FriendRequest;
        friendship?: Friend;
      }>(
        socket,
        'friend:check_status',
        { toUserId },
        'friend:status',
        'friend:error',
        10000
      );
    }
    
    const response = await api.get(`/friends/status/${toUserId}`);
    return response.data;
  },

  // Subscribe to real-time updates
  onFriendRequestsUpdated(callback: (requests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }) => void) {
    const socket = socketService.getSocket();
    socket?.on('friend:requests_updated', callback);
  },

  offFriendRequestsUpdated(callback: (requests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }) => void) {
    const socket = socketService.getSocket();
    socket?.off('friend:requests_updated', callback);
  },

  onFriendRequestReceived(callback: (request: FriendRequest) => void) {
    const socket = socketService.getSocket();
    socket?.on('friend:request_received', callback);
  },

  offFriendRequestReceived(callback: (request: FriendRequest) => void) {
    const socket = socketService.getSocket();
    socket?.off('friend:request_received', callback);
  },
};

