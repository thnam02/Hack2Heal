import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FriendRequests } from './FriendRequests';
import { Messages } from './Messages';

export function FriendsAndMessages() {
  return (
    <div className="p-8">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="friend-requests">Friend Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="mt-0">
          <div className="-m-8">
            <Messages />
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

