import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Reply, Archive, MailOpen } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface MessageThreadProps {
  messageId: number;
}

// Message type including sender and recipient details
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

// Form schema for replying to a message
const replyFormSchema = z.object({
  content: z.string().min(1, "Message content is required"),
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

export function MessageThread({ messageId }: MessageThreadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Fetch message thread
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/messages/thread", messageId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/thread/${messageId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch message thread");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // For messages addressed to the current user and still unread, mark them as read
      if (data.length > 0) {
        const unreadMessages = data.filter((message: Message) => 
          message.recipientId === user?.id && message.status === "unread"
        );
        
        unreadMessages.forEach((message: Message) => {
          markAsRead.mutate(message.id);
        });
      }
    }
  });
  
  // Get the original message (first in the thread or parent message)
  const originalMessage = messages.length > 0 ? messages[0] : null;
  
  // Mutation to mark message as read
  const markAsRead = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/messages/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "read" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", messageId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to archive message
  const archiveMessage = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/messages/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", messageId] });
      toast({
        title: "Success",
        description: "Message archived",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to reply to message
  const replyMessage = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", messageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: ReplyFormValues) => {
    if (!originalMessage) return;
    
    // Determine the recipient (swap with the original sender)
    const recipientId = originalMessage.senderId === user?.id 
      ? originalMessage.recipientId 
      : originalMessage.senderId;
    
    replyMessage.mutate({
      recipientId,
      subject: `Re: ${originalMessage.subject}`,
      content: values.content,
      parentId: messageId, // Link to the thread parent
    });
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading message...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  if (!originalMessage) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Message not found</CardTitle>
          <CardDescription>
            The message you're looking for may have been deleted or doesn't exist.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const canReply = user?.id !== originalMessage.senderId || messages.length > 1;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{originalMessage.subject}</CardTitle>
            <CardDescription>
              Conversation between {originalMessage.sender.firstName} {originalMessage.sender.lastName} and {originalMessage.recipient.firstName} {originalMessage.recipient.lastName}
            </CardDescription>
          </div>
          
          {originalMessage.recipientId === user?.id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => archiveMessage.mutate(originalMessage.id)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {messages.map((message: Message) => (
          <div 
            key={message.id}
            className={`flex flex-col rounded-lg p-4 ${
              message.senderId === user?.id 
                ? "bg-muted ml-8" 
                : "border ml-0 mr-8"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <Avatar>
                <AvatarFallback>
                  {message.sender.firstName.charAt(0)}
                  {message.sender.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">
                      {message.sender.firstName} {message.sender.lastName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {message.sender.role}
                    </p>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            </div>
            
            {message.recipientId === user?.id && (
              <div className="self-end mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {message.status === "unread" ? (
                    <Mail className="h-3 w-3" />
                  ) : message.status === "read" ? (
                    <MailOpen className="h-3 w-3" />
                  ) : (
                    <Archive className="h-3 w-3" />
                  )}
                  {message.status}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="flex-col items-stretch">
        {canReply && (
          <>
            <Separator className="mb-4" />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your reply here..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="flex items-center"
                  disabled={replyMessage.isPending}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {replyMessage.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardFooter>
    </Card>
  );
}