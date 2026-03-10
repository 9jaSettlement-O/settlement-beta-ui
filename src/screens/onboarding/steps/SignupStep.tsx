/**
 * Step 3: Set password and complete signup; token stored in auth store.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useAuthStore } from "@/store/auth.store";
import { signup } from "@/services/auth.service";
import { parseApiError } from "@/utils/parseApiError";

export default function SignupStep() {
  const {
    email,
    accountType,
    nextStep,
    prevStep,
    setAccountCreated,
    setLoading,
    setError,
    loading,
    error,
  } = useOnboardingStore();
  const { setToken, setUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const match = password === confirmPassword && password.length >= 8;

  const handleSubmit = async () => {
    if (!email || !accountType || !match || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signup({
        email,
        password,
        accountType,
      });
      if (result.token) {
        setToken(result.token);
        if (result.user)
          setUser({
            id: result.user.id,
            email: result.user.email,
            type: result.user.type,
          });
      }
      setAccountCreated(true);
      nextStep();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Create your account</h2>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">Set a password for {email}</p>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          disabled={loading}
        />
        {confirmPassword && !match && (
          <p className="text-xs text-destructive">Passwords do not match or too short.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => prevStep()} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !match}>
          {loading ? "Creating account…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
