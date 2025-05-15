import React from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageThread } from "@/components/messaging/message-thread";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function MessageThreadPage() {
  const params = useParams();
  const messageId = parseInt(params.id, 10);

  if (isNaN(messageId)) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Message ID</h1>
          <p className="text-muted-foreground mt-2">
            The message you are looking for does not exist or has an invalid ID.
          </p>
          <Link href="/messages">
            <Button className="mt-4">Go back to messages</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/messages">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Message Thread</h1>
            <p className="text-muted-foreground">View and reply to messages</p>
          </div>
        </div>

        <MessageThread messageId={messageId} />
      </div>
    </DashboardLayout>
  );
}
