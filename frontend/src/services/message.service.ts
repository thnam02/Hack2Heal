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
    // Log error in development
    if (import.meta.env.DEV) {
      console.warn('[messageService] Error clearing cache:', error);
    }
  }
}

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

export const messageService = {
  async sendMessage(toUserId: number, content: string): Promise<Message> {
    const socket = socketService.getSocket();
    
    let message: Message;
    
    if (socket?.connected) {
      message = await createSocketPromiseWithTimeout<Message>(
        socket,
        'message:send',
        { toUserId, content },
        'message:sent',
        'message:error',
        10000
      );
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
      if (import.meta.env.DEV) {
        console.log('[messageService.getConversations] Request already in progress, returning cache...');
      }
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
        if (import.meta.env.DEV) {
          console.log('[messageService.getConversations] Sync already in progress, skipping');
        }
        return;
      }
      syncInProgress = true;
      try {
        if (import.meta.env.DEV) {
          console.log('[messageService.getConversations] Syncing conversations in background...');
        }
        const response = await api.get<Conversation[]>('/messages/conversations');
        const conversations = response.data || [];
        if (useCache) {
          setCachedConversations(conversations);
        }
        if (import.meta.env.DEV) {
          console.log('[messageService.getConversations] Background sync completed:', conversations.length, 'conversations');
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[messageService.getConversations] Background sync failed:', error);
        }
        // Silently fail - cache will be used if available
      } finally {
        syncInProgress = false;
      }
    };

    // Step 1: Try to load from cache first (if enabled and available)
    if (useCache) {
      const cached = getCachedConversations();
      if (cached && cached.length > 0) {
        if (import.meta.env.DEV) {
          console.log('[messageService.getConversations] Using cache, found', cached.length, 'conversations');
        }
        // Return cached data immediately, then sync in background (only if not already syncing)
        if (!syncInProgress) {
          syncInBackground(); // Fire and forget
        }
        return cached;
      }
      if (import.meta.env.DEV) {
        console.log('[messageService.getConversations] No cache found, fetching from API');
      }
    }

    // Step 2: Fetch from backend (REST API only, NO WebSocket fallback to prevent loops)
    syncInProgress = true;
    try {
      if (import.meta.env.DEV) {
        console.log('[messageService.getConversations] Fetching from REST API...');
      }
      const response = await api.get<Conversation[]>('/messages/conversations');
      if (import.meta.env.DEV) {
        console.log('[messageService.getConversations] REST API response:', response.status, response.data?.length || 0, 'conversations');
      }
      const conversations = response.data || [];
      
      // Save to cache after successful fetch
      if (useCache) {
        setCachedConversations(conversations);
      }
      
      return conversations;
    } catch (restError) {
      if (import.meta.env.DEV) {
        console.error('[messageService.getConversations] REST API failed:', restError);
      }
      
      // If REST fails, try cache as last resort (NO WebSocket to prevent loops)
      const cached = getCachedConversations();
      if (cached && cached.length > 0) {
        if (import.meta.env.DEV) {
          console.log('[messageService.getConversations] Using expired cache as fallback');
        }
        return cached;
      }
      
      throw restError;
    } finally {
      syncInProgress = false;
    }
  },

  async getMessages(withUserId: number, limit = 50): Promise<Message[]> {
    if (import.meta.env.DEV) {
      console.log('[messageService.getMessages] Getting messages for userId:', withUserId, 'limit:', limit);
    }
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      if (import.meta.env.DEV) {
        console.log('[messageService.getMessages] Using WebSocket');
      }
      const result = await createSocketPromiseWithTimeout<{ withUserId: number; messages: Message[] }>(
        socket,
        'message:get_messages',
        { withUserId, limit },
        'message:messages',
        'message:error',
        10000
      );
      
      if (import.meta.env.DEV) {
        console.log('[messageService.getMessages] Received messages via WebSocket:', result.messages?.length || 0);
      }
      
      return result.messages || [];
    }
    
    if (import.meta.env.DEV) {
      console.log('[messageService.getMessages] Using REST API');
    }
    try {
      const response = await api.get<Message[]>(`/messages/conversation/${withUserId}`, {
        params: { limit },
      });
      if (import.meta.env.DEV) {
        console.log('[messageService.getMessages] REST API response:', response.status, response.data?.length || 0, 'messages');
      }
      return response.data || [];
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('[messageService.getMessages] REST API error:', error);
      }
      throw error;
    }
  },

  async markAsRead(messageId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      await createSocketPromiseWithTimeout<void>(
        socket,
        'message:mark_read',
        { messageId },
        'message:read',
        'message:error',
        10000
      );
    } else {
      await api.post(`/messages/read/${messageId}`);
    }
  },

  async markConversationAsRead(userId: number): Promise<void> {
    const socket = socketService.getSocket();
    
    if (socket?.connected) {
      await createSocketPromiseWithTimeout<void>(
        socket,
        'message:mark_conversation_read',
        { withUserId: userId },
        'message:conversation_read',
        'message:error',
        10000
      );
    } else {
      await api.post(`/messages/conversation/${userId}/read`);
    }
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

