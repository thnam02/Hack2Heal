import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserPlus, UserCheck, UserX, Users, Clock } from 'lucide-react';
import { friendService, FriendRequest } from '../services/friend.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function FriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<(FriendRequest & { userName?: string; userEmail?: string; userAvatar?: string })[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<(FriendRequest & { userName?: string; userEmail?: string; userAvatar?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  useEffect(() => {
    loadFriendRequests();
    
    // Subscribe to real-time updates
    const handleRequestsUpdated = (requests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }) => {
      setIncomingRequests(requests.incoming || []);
      setOutgoingRequests(requests.outgoing || []);
    };
    
    const handleRequestReceived = () => {
      // Refresh requests when new request received
      loadFriendRequests();
    };

    friendService.onFriendRequestsUpdated(handleRequestsUpdated);
    friendService.onFriendRequestReceived(handleRequestReceived);

    return () => {
      friendService.offFriendRequestsUpdated(handleRequestsUpdated);
      friendService.offFriendRequestReceived(handleRequestReceived);
    };
  }, []);

  const loadFriendRequests = async () => {
    try {
      setIsLoading(true);
      const response = await friendService.getAllFriendRequests();
      
      setIncomingRequests(response.incoming || []);
      setOutgoingRequests(response.outgoing || []);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to load friend requests');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: number, userName: string) => {
    try {
      await friendService.acceptFriendRequest(requestId);
      toast.success(`You're now friends with ${userName}!`);
      await loadFriendRequests();
    } catch (error: unknown) {
      const err = error as { code?: string; response?: { data?: { message?: string } } };
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        const errorMessage = err?.response?.data?.message || 'Failed to accept friend request';
        toast.error(errorMessage);
      }
    }
  };

  const handleReject = async (requestId: number, userName: string) => {
    try {
      await friendService.rejectFriendRequest(requestId);
      toast.success(`Friend request from ${userName} rejected`);
      await loadFriendRequests();
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code !== 'ERR_NETWORK' && err?.code !== 'ERR_CONNECTION_REFUSED') {
        toast.error('Failed to reject friend request');
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#2C2E6F] mb-2 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Friend Requests
        </h1>
        <p className="text-gray-600">Manage your friend requests and connections</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 px-4 font-semibold transition-colors relative ${
            activeTab === 'incoming'
              ? 'text-[#6F66FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Incoming
          {incomingRequests.length > 0 && (
            <Badge className="ml-2 bg-[#6F66FF] text-white">{incomingRequests.length}</Badge>
          )}
          {activeTab === 'incoming' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6F66FF]"
              layoutId="activeTab"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 px-4 font-semibold transition-colors relative ${
            activeTab === 'outgoing'
              ? 'text-[#6F66FF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Outgoing
          {outgoingRequests.length > 0 && (
            <Badge className="ml-2 bg-gray-500 text-white">{outgoingRequests.length}</Badge>
          )}
          {activeTab === 'outgoing' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6F66FF]"
              layoutId="activeTab"
            />
          )}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center text-gray-500">
            Loading friend requests...
          </CardContent>
        </Card>
      ) : activeTab === 'incoming' ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Incoming Friend Requests
              {incomingRequests.length > 0 && (
                <Badge className="ml-2 bg-[#6F66FF] text-white">{incomingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No incoming requests</h3>
                <p className="text-sm">You don't have any pending friend requests right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#6F66FF]/50 transition-all bg-white"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                      {request.userAvatar || request.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[#2C2E6F] font-semibold">{request.userName || `User ${request.fromUserId}`}</h4>
                      <p className="text-sm text-gray-500">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(request.id, request.userName || `User ${request.fromUserId}`)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id, request.userName || `User ${request.fromUserId}`)}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Outgoing Friend Requests
              {outgoingRequests.length > 0 && (
                <Badge className="ml-2 bg-gray-500 text-white">{outgoingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No outgoing requests</h3>
                <p className="text-sm">You haven't sent any friend requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 bg-white"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6F66FF] to-[#8C7BFF] flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                      {request.userAvatar || request.userName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[#2C2E6F] font-semibold">{request.userName || `User ${request.toUserId}`}</h4>
                      <p className="text-sm text-gray-500">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Waiting for response</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

