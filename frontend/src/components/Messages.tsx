import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MessageSquare, Send, Search, CheckCircle2, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messageService, Conversation, Message } from '../services/message.service';
import { friendService } from '../services/friend.service';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

export function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [friendshipStatus, setFriendshipStatus] = useState<'friends' | 'request_sent' | 'request_received' | 'not_friends' | 'loading'>('loading');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Track if messages are being loaded to prevent infinite loops
  const loadingMessagesRef = useRef<Set<number>>(new Set());

  // Check if navigating from leaderboard with userId
  useEffect(() => {
    const state = location.state as { userId?: number; userName?: string } | null;
    if (state?.userId) {
      setSelectedConversation(state.userId);
      setSelectedUserName(state.userName || null);
    }
  }, [location.state]);

  // Load conversations on mount (only once)
  useEffect(() => {
    let isMounted = true;
    let handlerRef: ((conversations: Conversation[]) => void) | null = null;

    const loadAndSubscribe = async () => {
      if (!isMounted) return;

      try {
        // Load conversations first
        await loadConversations();
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          console.error('[Messages] Error loading conversations:', error);
        }
      }

      if (!isMounted) return;

      // Subscribe to real-time conversation updates
      // This handler will be called when backend emits message:conversations_updated
      // We should NOT call loadConversations() again here to prevent loops
      const handleConversationsUpdated = (conversations: Conversation[]) => {
        if (!isMounted) return;

        if (import.meta.env.DEV) {
          console.log('[Messages] Received conversations_updated event, updating state');
        }
        const freshConversations = conversations || [];
        setConversations(freshConversations);
        // Update cache with fresh real-time data
        messageService.updateCache(freshConversations);
      };

      // Store handler ref for cleanup
      handlerRef = handleConversationsUpdated;
      messageService.onConversationsUpdated(handleConversationsUpdated);
    };

    // Start async operation
    loadAndSubscribe();

    // Cleanup function - always unsubscribe if handler was registered
    return () => {
      isMounted = false;
      if (handlerRef) {
        messageService.offConversationsUpdated(handlerRef);
        handlerRef = null;
      }
    };
  }, []); // Empty deps - only run once on mount

  // Check friendship status when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      checkFriendshipStatus();
    } else {
      setFriendshipStatus('loading');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, user?.id]); // checkFriendshipStatus is stable, no need to include

  // Load messages when conversation is selected
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Messages] useEffect - selectedConversation:', selectedConversation, 'friendshipStatus:', friendshipStatus);
    }
    
    // If conversation exists in conversations list, it means they have messages (are friends)
    // So we can load messages even if friendshipStatus is still loading
    const conversationExists = conversations.some(c => c.otherUserId === selectedConversation);
    
    if (selectedConversation) {
      // Prevent loading the same conversation multiple times
      if (loadingMessagesRef.current.has(selectedConversation)) {
        if (import.meta.env.DEV) {
          console.log('[Messages] Messages already loading for conversation:', selectedConversation);
        }
        return;
      }

      // If conversation exists, we can load messages immediately
      if (conversationExists || friendshipStatus === 'friends') {
        if (import.meta.env.DEV) {
          console.log('[Messages] Loading messages for conversation:', selectedConversation, 'conversationExists:', conversationExists, 'friendshipStatus:', friendshipStatus);
        }
        
        loadingMessagesRef.current.add(selectedConversation);
        loadMessages(selectedConversation).finally(() => {
          loadingMessagesRef.current.delete(selectedConversation);
        });
        
        // Mark conversation as read (but don't wait for it to complete)
        messageService.markConversationAsRead(selectedConversation).catch((error) => {
          // Log error but don't block UI - marking as read is non-critical
          if (import.meta.env.DEV) {
            console.error('[Messages] Error marking conversation as read:', error);
          }
          // Silently fail - this is a background operation
        });
      } else if (friendshipStatus === 'not_friends') {
        if (import.meta.env.DEV) {
          console.log('[Messages] Not friends, clearing messages');
        }
        setMessages([]);
      } else if (friendshipStatus === 'loading') {
        // Wait for friendship status check
        if (import.meta.env.DEV) {
          console.log('[Messages] Waiting for friendship status check...');
        }
      }
    } else {
      setMessages([]);
    }

    // Subscribe to real-time message updates for this conversation
    const handleMessageReceived = (message: Message) => {
      // Only add message if it's for the current conversation
      const fromUserId = Number(message.fromUserId);
      const toUserId = Number(message.toUserId);
      const currentUserId = Number(user?.id);
      const selectedUserId = Number(selectedConversation);
      
      if (
        (fromUserId === selectedUserId && toUserId === currentUserId) ||
        (toUserId === selectedUserId && fromUserId === currentUserId)
      ) {
        setMessages(prev => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    // Subscribe to real-time updates if conversation exists (they are friends)
    if (selectedConversation && (conversationExists || friendshipStatus === 'friends')) {
      messageService.onMessageReceived(handleMessageReceived);
    }

    return () => {
      if (selectedConversation) {
        messageService.offMessageReceived(handleMessageReceived);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, friendshipStatus, user?.id]); // conversations and loadMessages removed to prevent loop

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFriendshipStatus = async () => {
    if (!selectedConversation || !user?.id) {
      if (import.meta.env.DEV) {
        console.log('[Messages] checkFriendshipStatus - missing selectedConversation or user.id');
      }
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log('[Messages] checkFriendshipStatus - checking status for userId:', selectedConversation);
    }
    try {
      setFriendshipStatus('loading');
      const status = await friendService.getFriendRequestStatus(selectedConversation);
      if (import.meta.env.DEV) {
        console.log('[Messages] Friendship status result:', status.status);
      }
      setFriendshipStatus(status.status);
      
      // If we have a userName from location state but not in conversations, set it
      if (location.state && (location.state as { userName?: string }).userName && !selectedUserName) {
        setSelectedUserName((location.state as { userName?: string }).userName || null);
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('[Messages] Error checking friendship status:', error);
      }
      setFriendshipStatus('not_friends');
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      if (import.meta.env.DEV) {
        console.log('[Messages] loadConversations called');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await messageService.getConversations(true)) as any; // Use cache
      if (import.meta.env.DEV) {
        console.log('[Messages] loadConversations completed, got', data?.length || 0, 'conversations');
      }
      setConversations(data || []);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as { code?: string } & any;
      if (import.meta.env.DEV) {
        console.error('[Messages] Load conversations error:', error);
      }
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load conversations');
      }
      // Try to use expired cache as fallback
      try {
        const cached = localStorage.getItem('hack2heal_conversations');
        if (cached) {
          const conversations = JSON.parse(cached);
          setConversations(conversations || []);
        }
      } catch (cacheError) {
        if (import.meta.env.DEV) {
          console.error('[Messages] Cache fallback failed:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: number): Promise<void> => {
    if (import.meta.env.DEV) {
      console.log('[Messages] loadMessages called for userId:', userId);
    }
    try {
      setIsLoading(true);
      const data = await messageService.getMessages(userId);
      if (import.meta.env.DEV) {
        console.log('[Messages] Loaded messages:', data?.length || 0, 'messages');
        console.log('[Messages] Messages data:', data);
      }
      
      // Ensure messages are set
      if (data && Array.isArray(data) && data.length > 0) {
        if (import.meta.env.DEV) {
          console.log('[Messages] Setting messages to state:', data.length);
        }
        setMessages(data);
        
        // Force re-render by scrolling to bottom
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        if (import.meta.env.DEV) {
          console.log('[Messages] No messages found, setting empty array');
        }
        setMessages([]);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as { code?: string } & any;
      if (import.meta.env.DEV) {
        console.error('[Messages] Error loading messages:', error);
      }
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load messages');
      }
      setMessages([]);
    } finally {
      setIsLoading(false);
      if (import.meta.env.DEV) {
        console.log('[Messages] loadMessages completed, isLoading set to false');
      }
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || friendshipStatus !== 'friends') return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      await messageService.sendMessage(selectedConversation, content);
      // Reload messages
      await loadMessages(selectedConversation);
      // Reload conversations to update last message
      await loadConversations();
      toast.success('Message sent!');
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as { code?: string; response?: { data?: { message?: string } } } & any;
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        const errorMessage = err?.response?.data?.message || 'Failed to send message';
        toast.error(errorMessage);
      }
      // Restore message input on error
      setMessageInput(content);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!selectedConversation) return;

    try {
      await friendService.sendFriendRequest(selectedConversation);
      toast.success(`Friend request sent to ${selectedUserName || 'user'}!`);
      // Refresh friendship status
      await checkFriendshipStatus();
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as { code?: string; response?: { data?: { message?: string } } } & any;
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        const errorMessage = err?.response?.data?.message || 'Failed to send friend request';
        toast.error(errorMessage);
      }
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!selectedConversation || friendshipStatus !== 'request_received') return;

    try {
      // Get the friend request ID from the status
      const status = await friendService.getFriendRequestStatus(selectedConversation);
      if (status.request) {
        await friendService.acceptFriendRequest(status.request.id);
        toast.success(`You're now friends with ${selectedUserName || 'user'}!`);
        // Refresh friendship status
        await checkFriendshipStatus();
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as { code?: string } & any;
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to accept friend request');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.otherUserId === selectedConversation);
  const displayName = selectedConv?.otherUserName || selectedUserName || 'User';
  // If conversation exists, they are friends (have messages)
  const isFriends = selectedConv !== undefined || friendshipStatus === 'friends';
  
  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[Messages] Render - selectedConversation:', selectedConversation, 'selectedConv:', selectedConv, 'friendshipStatus:', friendshipStatus, 'isFriends:', isFriends, 'messages.length:', messages.length, 'isLoading:', isLoading);
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Messages
        </h1>
        <p className="text-gray-600">Connect and chat with your recovery community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="relative">
              <label htmlFor="search-conversations" className="sr-only">Search conversations</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="search-conversations"
                name="search-conversations"
                type="search"
                autoComplete="off"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto max-h-[calc(100vh-20rem)]">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading conversations...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Start a conversation from the leaderboard!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.otherUserId);
                        setSelectedUserName(conversation.otherUserName);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation === conversation.otherUserId
                          ? 'bg-[#6F66FF]/10 border-l-4 border-[#6F66FF]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                          {conversation.otherUserAvatar || conversation.otherUserName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-[#2C2E6F] truncate">
                              {conversation.otherUserName}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-[#6F66FF] text-white text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                          )}
                          {conversation.lastMessageTime && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(conversation.lastMessageTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages View */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="border-0 shadow-lg flex flex-col" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white font-semibold">
                    {selectedConv?.otherUserAvatar || displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{displayName}</CardTitle>
                    <p className="text-xs text-gray-500">
                      {friendshipStatus === 'friends' ? 'Online' : 
                       friendshipStatus === 'request_sent' ? 'Friend request sent' :
                       friendshipStatus === 'request_received' ? 'Sent you a friend request' :
                       friendshipStatus === 'loading' ? 'Checking...' :
                       'Not friends yet'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto' }}>
                {friendshipStatus === 'loading' && !selectedConv ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : isFriends ? (
                  <>
                    {/* Messages Area */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 bg-gray-50"
                      style={{ 
                        minHeight: '400px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {isLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                          <p className="text-gray-500">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-xs mt-1">Start the conversation!</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 py-2" style={{ width: '100%' }}>
                          {messages.map((message, index) => {
                            const isOwnMessage = message.fromUserId === Number(user?.id);
                            if (import.meta.env.DEV) {
                              console.log(`[Messages] Rendering message ${index}:`, message.id, message.content, 'isOwnMessage:', isOwnMessage);
                            }
                            return (
                              <div
                                key={message.id}
                                className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                style={{ marginBottom: '8px' }}
                              >
                                <div
                                  className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                    isOwnMessage
                                      ? 'bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF]'
                                      : ''
                                  }`}
                                  style={{ 
                                    wordWrap: 'break-word', 
                                    wordBreak: 'break-word',
                                    backgroundColor: isOwnMessage ? undefined : '#FFFFFF',
                                    border: isOwnMessage ? 'none' : '1px solid #E5E7EB'
                                  }}
                                >
                                  {/* Inline styles with !important require 'as any' for TypeScript compatibility */}
                                  {/* eslint-disable @typescript-eslint/no-explicit-any */}
                                  {isOwnMessage ? (
                                    <>
                                      <p 
                                        className="whitespace-pre-wrap break-words"
                                        style={{ 
                                          color: '#FFFFFF !important' as any,
                                          fontSize: '14px !important' as any,
                                          fontWeight: '400 !important' as any,
                                          lineHeight: '1.5 !important' as any,
                                          margin: '0 !important' as any,
                                          padding: '0 !important' as any
                                        }}
                                      >
                                        {message.content}
                                      </p>
                                      <div 
                                        className="flex items-center gap-1 mt-1"
                                        style={{ 
                                          color: 'rgba(255, 255, 255, 0.7) !important' as any,
                                          fontSize: '12px !important' as any,
                                          lineHeight: '1.5 !important' as any
                                        }}
                                      >
                                        <span>
                                          {new Date(message.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                        {message.read && (
                                          <CheckCircle2 
                                            className="w-3 h-3" 
                                            style={{ 
                                              color: 'rgba(255, 255, 255, 0.7) !important' as any,
                                              stroke: 'rgba(255, 255, 255, 0.7) !important' as any,
                                              fill: 'rgba(255, 255, 255, 0.7) !important' as any
                                            }} 
                                          />
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p 
                                        className="whitespace-pre-wrap break-words"
                                        style={{ 
                                          color: '#111827 !important' as any,
                                          fontSize: '14px !important' as any,
                                          fontWeight: '400 !important' as any,
                                          lineHeight: '1.5 !important' as any,
                                          margin: '0 !important' as any,
                                          padding: '0 !important' as any
                                        }}
                                      >
                                        {message.content}
                                      </p>
                                      <div 
                                        className="flex items-center gap-1 mt-1"
                                        style={{ 
                                          color: '#6B7280 !important' as any,
                                          fontSize: '12px !important' as any,
                                          lineHeight: '1.5 !important' as any
                                        }}
                                      >
                                        <span>
                                          {new Date(message.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} style={{ height: '1px' }} />
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4 bg-white">
                      <div className="flex gap-2">
                        <label htmlFor="message-input" className="sr-only">Type a message</label>
                        <Input
                          id="message-input"
                          name="message"
                          type="text"
                          autoComplete="off"
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={!messageInput.trim()}
                          className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white text-2xl font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#2C2E6F] mb-2">
                          {friendshipStatus === 'request_sent' 
                            ? 'Friend Request Sent'
                            : friendshipStatus === 'request_received'
                            ? 'Friend Request Received'
                            : 'Not Friends Yet'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {friendshipStatus === 'request_sent'
                            ? `You've sent a friend request to ${displayName}. Once they accept, you can start messaging!`
                            : friendshipStatus === 'request_received'
                            ? `${displayName} sent you a friend request. Accept to start messaging!`
                            : `You need to be friends with ${displayName} before you can message them. Send a friend request to get started!`}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {friendshipStatus === 'request_received' && (
                          <Button
                            onClick={handleAcceptFriendRequest}
                            className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Accept Request
                          </Button>
                        )}
                        {friendshipStatus === 'not_friends' && (
                          <Button
                            onClick={handleSendFriendRequest}
                            className="bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] hover:opacity-90 text-white"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Send Friend Request
                          </Button>
                        )}
                        {friendshipStatus === 'request_sent' && (
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            <span>Waiting for response...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg h-full flex items-center justify-center">
              <CardContent className="text-center text-gray-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

