import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { clearDeviceHint, setReturning } from "@/utils/device-hint.util";
import { getSafeReturnTo } from "@/utils/safe-redirect.util";
import { isKycVerifiedFromUser } from "@/utils/kyc-status.util";
import { PageTransition } from "@/components/transitions/PageTransition";
import { DecorativeLogoBackground } from "@/components/onboarding/DecorativeLogoBackground";
import AppLogo from "@/components/AppLogo";
import { parseApiError } from "@/utils/parseApiError";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const emailFromQuery = searchParams.get("email");
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const authLoading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState(emailFromQuery || "");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPassword(email, password);
      setFailedAttempts(0);
      const { user, accessToken } = useAuthStore.getState();
      if (accessToken && user) {
        const kycVerified = isKycVerifiedFromUser(user as unknown as Record<string, unknown>);
        setReturning();
        useOnboardingStore.getState().hydrateFromAuth(user.id, user.type, kycVerified);
        toast.success("Login successful");
        const target = getSafeReturnTo(returnTo);
        navigate(target);
      }
    } catch {
      setFailedAttempts((prev) => prev + 1);
      const msg = useAuthStore.getState().error ?? parseApiError(new Error("Login failed")).message;
      toast.error(msg);
    }
  };

  return (
    <PageTransition variant="slideScale">
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <DecorativeLogoBackground />
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="flex flex-col items-center flex-shrink-0 mb-6">
            <AppLogo className="mb-6" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-center text-3xl font-bold">Login</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(_e, sanitized) => setEmail(sanitized)}
                    sanitizeMode="email"
                    required
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {failedAttempts >= 2 && (
                      <Link
                        to="/forgot-password"
                        className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(_e, sanitized) => setPassword(sanitized)}
                    showPasswordToggle
                    required
                    disabled={authLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={authLoading} size="lg">
                  {authLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
                <p>
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/select-account-type"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                  >
                    Sign up here
                  </Link>
                </p>
                <p>
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90 bg-transparent border-none cursor-pointer p-0"
                    onClick={() => {
                      clearDeviceHint();
                      navigate("/select-account-type");
                    }}
                  >
                    Use another account
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageTransition>
  );
};

export default Login;
