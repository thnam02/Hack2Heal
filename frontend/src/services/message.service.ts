import api from './api';
import { socketService } from './socket.service';

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

// Cache utilities for conversations
const CACHE_KEY = 'hack2heal_conversations';
const CACHE_TIMESTAMP_KEY = 'hack2heal_conversations_timestamp';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Track if sync is in progress to prevent multiple syncs
let syncInProgress = false;

function getCachedConversations(): Conversation[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge > CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    return JSON.parse(cached) as Conversation[];
  } catch (error) {
    return null;
  }
}

function setCachedConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(conversations));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

function clearConversationsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    // Ignore errors
  }
}

export const messageService = {
  async sendMessage(toUserId: number, content: string): Promise<Message> {
    const socket = socketService.getSocket();
    
    let message: Message;
    
    if (socket?.connected) {
      message = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('message:send', { toUserId, content });
        
        socket.once('message:sent', (msg) => {
          clearTimeout(timeout);
          resolve(msg);
        });
        
        socket.once('message:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to send message'));
        });
      });
    } else {
      const response = await api.post<Message>('/messages/send', { toUserId, content });
      message = response.data;
    }
    
    // Invalidate cache when a new message is sent
    // The cache will be refreshed on next getConversations call or via real-time update
    clearConversationsCache();
    
    return message;
  },

  async getConversations(useCache = true): Promise<Conversation[]> {
    // Prevent multiple simultaneous calls
    if (syncInProgress) {
      console.log('[messageService.getConversations] Request already in progress, returning cache...');
      const cached = getCachedConversations();
      if (cached) {
        return cached;
      }
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      const cachedRetry = getCachedConversations();
      if (cachedRetry) {
        return cachedRetry;
      }
      return [];
    }

    // Helper function to sync conversations in background (only once at a time)
    const syncInBackground = async () => {
      if (syncInProgress) {
        console.log('[messageService.getConversations] Sync already in progress, skipping');
        return;
      }
      syncInProgress = true;
      try {
        console.log('[messageService.getConversations] Syncing conversations in background...');
        const response = await api.get<Conversation[]>('/messages/conversations');
        const conversations = response.data || [];
        if (useCache) {
          setCachedConversations(conversations);
        }
        console.log('[messageService.getConversations] Background sync completed:', conversations.length, 'conversations');
      } catch (error) {
        console.error('[messageService.getConversations] Background sync failed:', error);
        // Silently fail - cache will be used if available
      } finally {
        syncInProgress = false;
      }
    };

    // Step 1: Try to load from cache first (if enabled and available)
    if (useCache) {
      const cached = getCachedConversations();
      if (cached && cached.length > 0) {
        console.log('[messageService.getConversations] Using cache, found', cached.length, 'conversations');
        // Return cached data immediately, then sync in background (only if not already syncing)
        if (!syncInProgress) {
          syncInBackground(); // Fire and forget
        }
        return cached;
      }
      console.log('[messageService.getConversations] No cache found, fetching from API');
    }

    // Step 2: Fetch from backend (REST API only, NO WebSocket fallback to prevent loops)
    syncInProgress = true;
    try {
      console.log('[messageService.getConversations] Fetching from REST API...');
      const response = await api.get<Conversation[]>('/messages/conversations');
      console.log('[messageService.getConversations] REST API response:', response.status, response.data?.length || 0, 'conversations');
      const conversations = response.data || [];
      
      // Save to cache after successful fetch
      if (useCache) {
        setCachedConversations(conversations);
      }
      
      return conversations;
    } catch (restError) {
      console.error('[messageService.getConversations] REST API failed:', restError);
      
      // If REST fails, try cache as last resort (NO WebSocket to prevent loops)
      const cached = getCachedConversations();
      if (cached && cached.length > 0) {
        console.log('[messageService.getConversations] Using expired cache as fallback');
        return cached;
      }
      
      throw restError;
    } finally {
      syncInProgress = false;
    }
  },

  async getMessages(withUserId: number, limit = 50): Promise<Message[]> {
    console.log('[messageService.getMessages] Getting messages for userId:', withUserId, 'limit:', limit);
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      console.log('[messageService.getMessages] Using WebSocket');
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('[messageService.getMessages] WebSocket request timeout');
          reject(new Error('Request timeout'));
        }, 10000);
        
        socket.emit('message:get_messages', { withUserId, limit });
        console.log('[messageService.getMessages] Emitted message:get_messages');
        
        socket.once('message:messages', (data: { withUserId: number; messages: Message[] }) => {
          clearTimeout(timeout);
          console.log('[messageService.getMessages] Received messages via WebSocket:', data.messages?.length || 0);
          resolve(data.messages || []);
        });
        
        socket.once('message:error', (error) => {
          clearTimeout(timeout);
          console.error('[messageService.getMessages] WebSocket error:', error);
          reject(new Error(error.message || 'Failed to get messages'));
        });
      });
    }
    
    console.log('[messageService.getMessages] Using REST API');
    try {
      const response = await api.get<Message[]>(`/messages/conversation/${withUserId}`, {
        params: { limit },
      });
      console.log('[messageService.getMessages] REST API response:', response.status, response.data?.length || 0, 'messages');
      return response.data || [];
    } catch (error: unknown) {
      console.error('[messageService.getMessages] REST API error:', error);
      throw error;
    }
  },

  async markAsRead(messageId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('message:mark_read', { messageId });
        
        socket.once('message:read', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        socket.once('message:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to mark message as read'));
        });
      });
    }
    
    await api.post(`/messages/read/${messageId}`);
  },

  async markConversationAsRead(userId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
        
        socket.emit('message:mark_conversation_read', { withUserId: userId });
        
        socket.once('message:conversation_read', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        socket.once('message:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message || 'Failed to mark conversation as read'));
        });
      });
    }
    
    await api.post(`/messages/conversation/${userId}/read`);
  },

  // Subscribe to real-time message updates
  onMessageReceived(callback: (message: Message) => void) {
    const socket = socketService.getSocket();
    socket?.on('message:received', callback);
  },

  offMessageReceived(callback: (message: Message) => void) {
    const socket = socketService.getSocket();
    socket?.off('message:received', callback);
  },

  onConversationsUpdated(callback: (conversations: Conversation[]) => void) {
    const socket = socketService.getSocket();
    socket?.on('message:conversations_updated', callback);
  },

  offConversationsUpdated(callback: (conversations: Conversation[]) => void) {
    const socket = socketService.getSocket();
    socket?.off('message:conversations_updated', callback);
  },

  // Clear conversations cache (useful for logout or when data needs to be refreshed)
  clearCache() {
    clearConversationsCache();
  },

  // Update conversations cache with fresh data (used for real-time updates)
  updateCache(conversations: Conversation[]) {
    setCachedConversations(conversations);
  },
};

