import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ErrorUIProps {
  error?: Error;
  onRetry?: () => void;
}

const ErrorUI = ({ error, onRetry }: ErrorUIProps) => {
  const navigate = useNavigate();
  const isGitHubPages = typeof window !== "undefined" && window.location.hostname.includes("github.io");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again.
          </CardDescription>
          {isGitHubPages && error && (
            <pre className="mt-3 text-left text-xs bg-muted p-3 rounded overflow-auto max-h-24">
              {error.message}
            </pre>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          )}
          <Button onClick={() => navigate(-1)} className="w-full" variant={onRetry ? "outline" : "default"}>
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorUI;
