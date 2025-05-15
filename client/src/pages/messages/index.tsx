import React, { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageList } from "@/components/messaging/message-list";
import { Inbox, Send, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Manage your communications with doctors and patients
            </p>
          </div>
          <Link href="/messages/compose">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Messages</CardTitle>
                <CardDescription>View and respond to messages</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="inbox"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Sent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox">
                <MessageList type="inbox" />
              </TabsContent>

              <TabsContent value="sent">
                <MessageList type="sent" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
