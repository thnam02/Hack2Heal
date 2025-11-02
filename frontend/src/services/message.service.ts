import api from './api';

export interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: number;
  userId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export const messageService = {
  async sendMessage(toUserId: number, content: string): Promise<Message> {
    const response = await api.post<Message>('/messages/send', { toUserId, content });
    return response.data;
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/messages/conversations');
    return response.data;
  },

  async getMessages(withUserId: number, limit = 50): Promise<Message[]> {
    const response = await api.get<Message[]>(`/messages/conversation/${withUserId}`, {
      params: { limit },
    });
    return response.data;
  },

  async markAsRead(messageId: number): Promise<void> {
    await api.post(`/messages/read/${messageId}`);
  },

  async markConversationAsRead(userId: number): Promise<void> {
    await api.post(`/messages/conversation/${userId}/read`);
  },
};

