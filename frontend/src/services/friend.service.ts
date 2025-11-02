import api from './api';
import { socketService } from './socket.service';

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
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:send_request', { toUserId });
        
        socket.once('friend:request_sent', (request) => {
          clearTimeout(timeout);
          resolve(request);
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to send friend request'));
        });
      });
    }
    
    // Fallback to REST
    const response = await api.post<FriendRequest>('/friends/request', { toUserId });
    return response.data;
  },

  async acceptFriendRequest(requestId: number): Promise<FriendRequest> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:accept_request', { requestId });
        
        socket.once('friend:request_accepted', (data) => {
          clearTimeout(timeout);
          // Backend returns FriendRequest, create a minimal one
          resolve({ id: data.requestId || requestId, status: 'accepted' } as FriendRequest);
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to accept friend request'));
        });
      });
    }
    
    const response = await api.post<FriendRequest>(`/friends/accept/${requestId}`);
    return response.data;
  },

  async rejectFriendRequest(requestId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:reject_request', { requestId });
        
        socket.once('friend:request_rejected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to reject friend request'));
        });
      });
    }
    
    await api.post(`/friends/reject/${requestId}`);
  },

  async getFriends(): Promise<Friend[]> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:get_friends');
        
        socket.once('friend:friends', (friends) => {
          clearTimeout(timeout);
          resolve(friends);
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to get friends'));
        });
      });
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
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:get_requests');
        
        socket.once('friend:requests', (requests) => {
          clearTimeout(timeout);
          resolve(requests);
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to get friend requests'));
        });
      });
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
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('friend:check_status', { toUserId });
        
        socket.once('friend:status', (status) => {
          clearTimeout(timeout);
          resolve(status);
        });
        
        socket.once('friend:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to check status'));
        });
      });
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

