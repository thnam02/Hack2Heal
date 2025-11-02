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
import { motion } from 'framer-motion';
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

  // Check if navigating from leaderboard with userId
  useEffect(() => {
    const state = location.state as { userId?: number; userName?: string } | null;
    if (state?.userId) {
      setSelectedConversation(state.userId);
      setSelectedUserName(state.userName || null);
    }
  }, [location.state]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Check friendship status when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      checkFriendshipStatus();
    } else {
      setFriendshipStatus('loading');
    }
  }, [selectedConversation, user?.id]);

  // Load messages when conversation is selected and users are friends
  useEffect(() => {
    if (selectedConversation && friendshipStatus === 'friends') {
      loadMessages(selectedConversation);
      // Mark conversation as read
      messageService.markConversationAsRead(selectedConversation).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [selectedConversation, friendshipStatus]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkFriendshipStatus = async () => {
    if (!selectedConversation || !user?.id) return;
    
    try {
      setFriendshipStatus('loading');
      const status = await friendService.getFriendRequestStatus(selectedConversation);
      setFriendshipStatus(status.status);
      
      // If we have a userName from location state but not in conversations, set it
      if (location.state && (location.state as { userName?: string }).userName && !selectedUserName) {
        setSelectedUserName((location.state as { userName?: string }).userName || null);
      }
    } catch (error: any) {
      setFriendshipStatus('not_friends');
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load conversations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const data = await messageService.getMessages(userId);
      setMessages(data);
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load messages');
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
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
        const errorMessage = error?.response?.data?.message || 'Failed to send message';
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
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
        const errorMessage = error?.response?.data?.message || 'Failed to send friend request';
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
    } catch (error: any) {
      if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CONNECTION_REFUSED') {
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
  const isFriends = friendshipStatus === 'friends';

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
            <Card className="border-0 shadow-lg h-full flex flex-col">
              <CardHeader className="border-b">
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
              <CardContent className="flex-1 flex flex-col p-0">
                {friendshipStatus === 'loading' ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : isFriends ? (
                  <>
                    {/* Messages Area */}
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                    >
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-xs mt-1">Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwnMessage = message.fromUserId === Number(user?.id);
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-gradient-to-r from-[#6F66FF] to-[#8C7BFF] text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className={`flex items-center gap-1 mt-1 text-xs ${
                                  isOwnMessage ? 'text-white/70' : 'text-gray-400'
                                }`}>
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {isOwnMessage && message.read && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
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

