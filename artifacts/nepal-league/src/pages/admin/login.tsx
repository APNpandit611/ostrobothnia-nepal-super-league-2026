import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trophy, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetAdminMeQueryKey(), data);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid credentials. Please try again.",
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tight">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the tournament management panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin" 
                required 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                className="bg-muted"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-bold uppercase tracking-wider" 
              size="lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Link href="/">
        <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Back to public site
        </div>
      </Link>
    </div>
  );
}
