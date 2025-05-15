import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/use-auth";
import { Search, Mail, MailOpen } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  subject: string;
  content: string;
  status: "unread" | "read" | "archived";
  parentId: number | null;
  createdAt: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  recipient: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface MessageListProps {
  type: "inbox" | "sent";
}

export function MessageList({ type }: MessageListProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const pageSize = 10;
  
  const endpoint = type === "inbox" 
    ? `/api/messages?tab=${type}&page=${page}&search=${searchTerm}`
    : `/api/messages/sent?page=${page}&search=${searchTerm}`;
    
  const { data, isLoading, isError } = useQuery({
    queryKey: [endpoint],
    enabled: !!user,
  });
  
  const messages: Message[] = Array.isArray(data) ? data : [];
  const totalPages = Math.ceil(messages.length / pageSize);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <Skeleton className="h-4 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return <div>Error loading messages</div>;
  }
  
  if (messages.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No messages found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {messages.map((message: Message) => (
        <Link key={message.id} href={`/messages/thread/${message.id}`}>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {type === "inbox" 
                        ? `${message.sender.firstName} ${message.sender.lastName}`
                        : `${message.recipient.firstName} ${message.recipient.lastName}`
                      }
                    </h3>
                    {message.status === "unread" && type === "inbox" && (
                      <Badge variant="default">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {message.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {message.status === "unread" && type === "inbox" ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-sm mt-2 line-clamp-1 text-muted-foreground">
                {message.content}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                disabled={page === 1}
              >
                <PaginationPrevious className="h-4 w-4" />
              </Button>
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                disabled={page === totalPages}
              >
                <PaginationNext className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}