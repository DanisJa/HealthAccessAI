import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComposeMessage } from "@/components/messaging/compose-message";
import { ArrowLeft } from "lucide-react";

export default function ComposeMessagePage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/messages">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Compose Message</h1>
          <p className="text-muted-foreground">
            Create a new message to a doctor or patient
          </p>
        </div>
      </div>
      
      <ComposeMessage />
    </div>
  );
}