import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/../utils/supabaseClient";
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
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  status: "unread" | "read" | "archived";
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  recipient: {
    id: string;
    first_name: string;
    last_name: string;
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

  const fetchMessages = async () => {
    if (!user) return [];

    let query = supabase
      .from('messages_with_users')
      .select('*')
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (type === 'inbox') {
      query = query.eq('reciever_id', user.id);
    } else {
      query = query.eq('sender_id', user.id);
    }

    if (searchTerm) {
      query = query.ilike('subject', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: [type, page, searchTerm, user?.id],
    queryFn: fetchMessages,
    enabled: !!user,
    refetchInterval: 500, // refetch every 10 seconds
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
                        ? `${message.sender.first_name} ${message.sender.last_name}`
                        : `${message.recipient.first_name} ${message.recipient.last_name}`
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
                    {new Date(message.created_at).toLocaleDateString()}
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