import api from './api';

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
    const response = await api.post<FriendRequest>('/friends/request', { toUserId });
    return response.data;
  },

  async acceptFriendRequest(requestId: number): Promise<Friend> {
    const response = await api.post<Friend>(`/friends/accept/${requestId}`);
    return response.data;
  },

  async rejectFriendRequest(requestId: number): Promise<void> {
    await api.post(`/friends/reject/${requestId}`);
  },

  async getFriends(): Promise<Friend[]> {
    const response = await api.get<Friend[]>('/friends');
    return response.data;
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await api.get<FriendRequest[]>('/friends/requests');
    return response.data;
  },

  async getAllFriendRequests(): Promise<{
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  }> {
    const response = await api.get<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends/requests/all');
    return response.data;
  },

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const response = await api.get<boolean>(`/friends/check/${userId2}`);
    return response.data;
  },

  async getFriendRequestStatus(toUserId: number): Promise<{
    status: 'friends' | 'request_sent' | 'request_received' | 'not_friends';
    request?: FriendRequest;
    friendship?: Friend;
  }> {
    const response = await api.get(`/friends/status/${toUserId}`);
    return response.data;
  },
};

