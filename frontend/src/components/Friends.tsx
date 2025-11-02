import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Users, Search, MessageSquare, UserCheck } from 'lucide-react';
import { friendService, Friend } from '../services/friend.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<(Friend & { userName?: string; userAvatar?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFriends();

    friendService.onFriendRequestsUpdated(() => {
      // Refresh when friend requests are accepted/rejected
      loadFriends();
    });

    return () => {
      friendService.offFriendRequestsUpdated(() => {});
    };
  }, []);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      const data = await friendService.getFriends();
      
      // Get user info for each friend - use friendName from Friend interface
      const friendsWithInfo = data.map((friend) => ({
        ...friend,
        userName: friend.friendName || `User ${friend.friendId}`,
        userAvatar: friend.friendName?.charAt(0).toUpperCase() || '?',
        userId: friend.friendId, // For navigation
      }));
      
      setFriends(friendsWithInfo);
    } catch (error: unknown) {
      const err = error as { code?: string };
      console.error('Failed to load friends:', error);
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load friends');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Friends</h1>
          <p className="text-gray-600 mt-1">Connect with your recovery community</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white font-semibold">
            <Users className="w-5 h-5" />
          </div>
          <Badge className="bg-[#6F66FF]/10 text-[#6F66FF] border-[#6F66FF]/20">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Friends List */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#6F66FF]" />
            Friends ({filteredFriends.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading friends...</div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Connect with others in the Quests & XP section'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFriends.map((friend, index) => (
                <motion.div
                  key={friend.id || friend.friendId || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border border-gray-200 hover:border-[#6F66FF]/50 hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white font-semibold">
                            {friend.userAvatar || friend.userName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{friend.userName || friend.friendName || `User ${friend.friendId}`}</h3>
                            <p className="text-sm text-gray-500">
                              Friend since {new Date(friend.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigate('/friends-messages', { 
                                state: { 
                                  tab: 'messages',
                                  userId: friend.friendId,
                                  userName: friend.userName || friend.friendName 
                                } 
                              });
                            }}
                            className="text-xs h-8 px-3 bg-white border-[#6F66FF] text-[#6F66FF] hover:bg-[#6F66FF]/10"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

