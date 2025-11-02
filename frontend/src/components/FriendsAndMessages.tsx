import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FriendRequests } from './FriendRequests';
import { Messages } from './Messages';
import { Friends } from './Friends';
import { useLocation } from 'react-router-dom';

export function FriendsAndMessages() {
  const location = useLocation();
  const [defaultTab, setDefaultTab] = useState('messages');

  // Check if navigating from Friends page or with tab state
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab) {
      setDefaultTab(state.tab);
    } else if (location.pathname === '/friends') {
      setDefaultTab('friends');
    }
  }, [location]);

  return (
    <div className="p-8">
      <Tabs defaultValue={defaultTab} value={defaultTab} onValueChange={setDefaultTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="friend-requests">Friend Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="mt-0">
          <div className="-m-8">
            <Messages />
          </div>
        </TabsContent>
        
        <TabsContent value="friends" className="mt-0">
          <div className="-m-8">
            <Friends />
          </div>
        </TabsContent>
        
        <TabsContent value="friend-requests" className="mt-0">
          <div className="-m-8">
            <FriendRequests />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

