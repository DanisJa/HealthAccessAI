import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Send } from "lucide-react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: "doctor" | "patient" | "hospital";
}

// Form schema for composing a message
const messageFormSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required").max(100, "Subject is too long"),
  content: z.string().min(1, "Message content is required"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

export function ComposeMessage() {
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Determine which type of users to fetch based on current user's role
  const recipientType = user?.role === "patient" ? "doctor" : 
                        user?.role === "doctor" ? "patient" : 
                        "all";
  
  // Query for potential recipients
  const { data: recipients = [], isLoading: loadingRecipients } = useQuery({
    queryKey: ["/api/users/list", { role: recipientType }],
    queryFn: async () => {
      // For simplicity in this example, we'll mock this until we implement the API
      // In a real implementation, this would be fetched from the backend
      let mockRecipients = [];
      
      if (recipientType === "doctor" || recipientType === "all") {
        mockRecipients.push({
          id: 1,
          firstName: "John",
          lastName: "Smith",
          role: "doctor"
        });
      }
      
      if (recipientType === "patient" || recipientType === "all") {
        mockRecipients.push({
          id: 2,
          firstName: "Jane",
          lastName: "Doe",
          role: "patient"
        });
      }
      
      if (recipientType === "all") {
        mockRecipients.push({
          id: 3,
          firstName: "General",
          lastName: "Hospital",
          role: "hospital"
        });
      }
      
      return mockRecipients;
    }
  });
  
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipientId: "",
      subject: "",
      content: "",
    },
  });
  
  // Mutation to send a message
  const sendMessage = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/sent"] });
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      navigate("/messages");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: MessageFormValues) => {
    sendMessage.mutate({
      recipientId: parseInt(values.recipientId),
      subject: values.subject,
      content: values.content,
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
        <CardDescription>
          Create a new message to communicate with your healthcare providers or patients.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingRecipients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipients.map((recipient: User) => (
                        <SelectItem key={recipient.id} value={recipient.id.toString()}>
                          {recipient.firstName} {recipient.lastName} ({recipient.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Message subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/messages")}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={sendMessage.isPending}
              className="flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}