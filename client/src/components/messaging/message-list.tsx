import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Search, Mail, MailOpen, Archive } from "lucide-react";
import { format } from "date-fns";

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
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface MessageListProps {
  type: "inbox" | "sent";
}

export function MessageList({ type }: MessageListProps) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState(type === "inbox" ? "unread" : "all");
  
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [
      type === "inbox" ? "/api/messages/inbox" : "/api/messages/sent", 
      { tab, page, search }
    ],
    queryFn: async () => {
      const url = new URL(
        type === "inbox" ? "/api/messages/inbox" : "/api/messages/sent",
        window.location.origin
      );
      
      if (type === "inbox") {
        url.searchParams.append("tab", tab);
      }
      
      url.searchParams.append("page", page.toString());
      url.searchParams.append("search", search);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      
      return response.json();
    }
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger query refetch by changing state
    setPage(1); // Reset to first page on new search
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return <Mail className="h-4 w-4" />;
      case "read":
        return <MailOpen className="h-4 w-4" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {type === "inbox" ? "Inbox" : "Sent Messages"}
        </CardTitle>
        <CardDescription>
          {type === "inbox" 
            ? "Messages you've received from doctors, hospitals, and staff." 
            : "Messages you've sent to doctors, hospitals, and staff."}
        </CardDescription>
        
        {type === "inbox" && (
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 mt-4">
          <Input
            type="search"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No messages found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[200px]">{type === "inbox" ? "From" : "To"}</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[150px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message: Message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <Badge 
                      variant={message.status === "unread" ? "default" : "outline"}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(message.status)}
                      {message.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {type === "inbox" 
                      ? `${message.sender.firstName} ${message.sender.lastName}`
                      : `${message.sender.firstName} ${message.sender.lastName}`}
                    <div className="text-xs text-muted-foreground">
                      {message.sender.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/messages/thread/${message.parentId || message.id}`} className="hover:underline">
                      {message.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {format(new Date(message.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div>
          {messages.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {messages.length} {messages.length === 1 ? "message" : "messages"}
            </p>
          )}
        </div>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page <= 1} 
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(prev => prev + 1)}
                disabled={messages.length < 10} // Assuming page size is 10
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}