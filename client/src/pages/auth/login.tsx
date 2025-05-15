import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoginInput, loginSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [_, navigate] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && typeof user === 'object' && 'role' in user) {
      switch(user.role) {
        case 'doctor':
          navigate("/doctor");
          break;
        case 'patient':
          navigate("/patient");
          break;
        case 'hospital':
          navigate("/hospital");
          break;
        default:
          navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const userData = await login(data);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect based on user role
      if (userData && typeof userData === 'object' && 'role' in userData) {
        switch(userData.role) {
          case 'doctor':
            navigate("/doctor");
            break;
          case 'patient':
            navigate("/patient");
            break;
          case 'hospital':
            navigate("/hospital");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <span className="material-icons text-primary text-3xl mr-2">favorite</span>
            <h1 className="text-2xl font-bold text-primary font-heading">HealthIoT</h1>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
              Sign up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
