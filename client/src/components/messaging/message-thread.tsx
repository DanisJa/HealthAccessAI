import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MessageThreadProps {
  messageId: number;
}

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

const replyFormSchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

type ReplyFormValues = z.infer<typeof replyFormSchema>;

export function MessageThread({ messageId }: MessageThreadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/messages/thread/${messageId}`],
    enabled: !!user && !!messageId,
  });
  
  const messages: Message[] = Array.isArray(data) ? data : [];
  
  // Mark messages as read when thread is opened
  const markAsRead = useMutation({
    mutationFn: async (messageId: number) => {
      return fetch(`/api/messages/${messageId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "read" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/thread/${messageId}`] });
    },
  });
  
  // Find unread messages sent to the current user and mark them as read
  useEffect(() => {
    if (messages && user) {
      const unreadMessages = messages.filter((message: Message) => 
        message.status === "unread" && message.recipientId === user.id
      );
      
      unreadMessages.forEach((message: Message) => {
        markAsRead.mutate(message.id);
      });
    }
  }, [messages, user]);
  
  // Form for replying to messages
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Mutation for sending a reply
  const sendReply = useMutation({
    mutationFn: async (data: any) => {
      return fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/thread/${messageId}`] });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ReplyFormValues) => {
    if (!messages || messages.length === 0) return;
    
    // Determine the recipient (the other party in the conversation)
    const originalMessage = messages[0];
    const recipientId = originalMessage.senderId === user?.id
      ? originalMessage.recipientId
      : originalMessage.senderId;
    
    sendReply.mutate({
      recipientId,
      subject: `Re: ${originalMessage.subject}`,
      content: values.content,
      parentId: messageId,
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isError || !messages || messages.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">Message thread not found or an error occurred</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Determine the conversation subject from the first message
  const conversationSubject = messages[0].subject;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{conversationSubject}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {messages.map((message: Message) => {
              const isUserSender = message.senderId === user?.id;
              const initials = `${message.sender.firstName.charAt(0)}${message.sender.lastName.charAt(0)}`;
              const formattedDate = new Date(message.createdAt).toLocaleString();
              
              return (
                <div key={message.id} className={`flex gap-4 ${isUserSender ? 'flex-row-reverse' : ''}`}>
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className={`space-y-2 flex-1 ${isUserSender ? 'text-right' : 'text-left'}`}>
                    <div className={`flex ${isUserSender ? 'justify-end' : 'justify-between'} items-center`}>
                      <div className={`flex items-center gap-2 ${isUserSender ? 'order-2' : 'order-1'}`}>
                        <span className="font-medium">
                          {message.sender.firstName} {message.sender.lastName}
                        </span>
                        <Badge variant="outline">
                          {message.sender.role}
                        </Badge>
                      </div>
                      <span className={`text-xs text-muted-foreground ${isUserSender ? 'order-1 mr-2' : 'order-2'}`}>
                        {formattedDate}
                      </span>
                    </div>
                    <div 
                      className={`p-4 rounded-lg ${
                        isUserSender 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted mr-auto'
                      }`}
                      style={{ maxWidth: '80%' }}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
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
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={sendReply.isPending}
              >
                <Send className="h-4 w-4" />
                {sendReply.isPending ? "Sending..." : "Send Reply"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}