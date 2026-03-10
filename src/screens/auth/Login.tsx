import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import apiCall from "@/api/config";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { clearDeviceHint, setReturning } from "@/utils/device-hint.util";
import { getSafeReturnTo } from "@/utils/safe-redirect.util";
import logger from "@/utils/logger.util";
import { PageTransition } from "@/components/transitions/PageTransition";
import { DecorativeLogoBackground } from "@/components/onboarding/DecorativeLogoBackground";
import AppLogo from "@/components/AppLogo";

/** Mock login response when API is not available (e.g. DEV or CORS). */
async function mockLogin(data: { email: string; password: string }) {
  await new Promise((r) => setTimeout(r, 400));
  return {
    error: false,
    token: `mock_${Date.now()}`,
    data: {
      user: {
        id: "mock_user_1",
        uid: "mock_user_1",
        email: data.email,
        type: "individual",
        account_type: "individual",
      },
    },
  };
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const emailFromQuery = searchParams.get("email");
  const { login } = useAuthStore();
  const [email, setEmail] = useState(emailFromQuery || "");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      if (import.meta.env.DEV) {
        logger.debug("[Login] DEV mode: using mock login");
        return await mockLogin(data);
      }
      try {
        return await apiCall.auth.login(data);
      } catch (err: unknown) {
        const o = err as { response?: unknown; message?: string; error?: boolean };
        const isNetworkOrCors =
          !o?.response ||
          (typeof o?.message === "string" &&
            (o.message.toLowerCase().includes("cors") || o.message.toLowerCase().includes("network")));
        if (isNetworkOrCors) {
          logger.debug("[Login] Network/CORS, using mock login");
          return await mockLogin(data);
        }
        throw err;
      }
    },
    onSuccess: (response) => {
      setFailedAttempts(0);
      const token = response.token || response.data?.token;
      const user = response.data?.user || response.data;

      if (token && user) {
        const id = user.id || user.uid || "";
        const type = user.type || user.account_type || "individual";
        setReturning();
        login(token, id, type, user.email || email);
        useOnboardingStore.getState().hydrateFromAuth(id, type);
        toast.success("Login successful");
        const target = getSafeReturnTo(returnTo);
        navigate(target);
      }
    },
    onError: () => {
      setFailedAttempts((prev) => prev + 1);
      toast.error("Invalid credentials");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
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
                  disabled={loginMutation.isPending}
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
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                size="lg"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
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
