import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { MessageList } from "@/components/messaging/message-list";
import { PenSquare } from "lucide-react";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("inbox");
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link href="/messages/compose">
          <Button className="flex items-center gap-2">
            <PenSquare className="h-4 w-4" />
            Compose Message
          </Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="mt-4">
          <MessageList type="inbox" />
        </TabsContent>
        
        <TabsContent value="sent" className="mt-4">
          <MessageList type="sent" />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}