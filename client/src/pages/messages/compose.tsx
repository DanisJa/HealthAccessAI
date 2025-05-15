import React from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { ComposeMessage } from "@/components/messaging/compose-message";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ComposeMessagePage() {
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
        
        <ComposeMessage />
      </div>
    </DashboardLayout>
  );
}