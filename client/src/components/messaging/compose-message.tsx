import React, { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
import { useAuth } from "@/hooks/use-auth";

const messageFormSchema = z.object({
  recipientId: z.coerce.number({
    required_error: "Please select a recipient",
  }),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

export function ComposeMessage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  // Get available recipients based on user role
  const { data: recipients, isLoading: isLoadingRecipients } = useQuery({
    queryKey: [user?.role === "doctor" ? "/api/patients" : "/api/doctors"],
    enabled: !!user,
  });
  
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });
  
  const sendMessage = useMutation({
    mutationFn: async (data: MessageFormValues) => {
      return fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to send message");
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
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
    },
  });
  
  const onSubmit = (values: MessageFormValues) => {
    sendMessage.mutate(values);
  };
  
  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Compose New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value?.toString()}
                    disabled={isLoadingRecipients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipients?.map((recipient: any) => (
                        <SelectItem 
                          key={recipient.id} 
                          value={recipient.id.toString()}
                        >
                          {recipient.firstName} {recipient.lastName}
                          {recipient.specialty && ` (${recipient.specialty})`}
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
          <CardFooter className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2"
              onClick={() => navigate("/messages")}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={sendMessage.isPending}
            >
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}