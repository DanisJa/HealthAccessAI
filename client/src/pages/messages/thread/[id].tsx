import React from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { MessageThread } from "@/components/messaging/message-thread";
import { ArrowLeft } from "lucide-react";

export default function MessageThreadPage() {
  const params = useParams();
  const messageId = parseInt(params.id);
  
  if (isNaN(messageId)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <Link href="/messages">
              <Button variant="ghost" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Messages
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center p-8">
            <p>Invalid message ID</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <Link href="/messages">
            <Button variant="ghost" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Messages
            </Button>
          </Link>
        </div>
        
        <MessageThread messageId={messageId} />
      </div>
    </DashboardLayout>
  );
}