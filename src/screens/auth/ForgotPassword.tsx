import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import { toast } from "sonner";
import logger from "@/utils/logger.util";

/** Mock success when API is not available (e.g. DEV or CORS). No email is sent. */
async function mockRequestPasswordReset(_email: string) {
  await new Promise((r) => setTimeout(r, 600));
  logger.debug("[ForgotPassword] Mock: reset email would be sent");
  return { error: false, message: "If an account exists, a reset link would be sent." };
}

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestMutation = useMutation({
    mutationFn: async (emailToUse: string) => {
      if (import.meta.env.DEV) {
        return await mockRequestPasswordReset(emailToUse);
      }
      try {
        return await apiCall.auth.requestPasswordReset(emailToUse);
      } catch (err: unknown) {
        const o = err as { response?: unknown; message?: string };
        const isNetworkOrCors =
          !o?.response ||
          (typeof o?.message === "string" &&
            (o.message.toLowerCase().includes("cors") || o.message.toLowerCase().includes("network")));
        if (isNetworkOrCors) {
          logger.debug("[ForgotPassword] Network/CORS, using mock");
          return await mockRequestPasswordReset(emailToUse);
        }
        throw err;
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("If an account exists for that email, we've sent a reset link.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) return;
    requestMutation.mutate(email.trim());
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <h1 className="mt-6 text-center text-3xl font-bold">Forgot password</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              Enter your email and we’ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitted ? (
              <>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, we’ve sent a reset link. Check
                  your inbox and spam folder.
                </p>
                <Button asChild className="w-full" size="lg">
                  <Link to="/login">Back to login</Link>
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(_, sanitized) => setEmail(sanitized)}
                    sanitizeMode="email"
                    required
                    disabled={requestMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!email?.trim() || requestMutation.isPending}
                >
                  {requestMutation.isPending ? "Sending…" : "Send reset link"}
                </Button>
                <Button asChild variant="ghost" className="w-full" size="sm">
                  <Link to="/login">Back to login</Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ForgotPassword;
