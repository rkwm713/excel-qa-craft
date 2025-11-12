import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthErrorType = 'network' | 'auth' | 'profile' | null;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<AuthErrorType>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSessionDelayed, setIsSessionDelayed] = useState(false);
  const location = useLocation();

  const checkAuthAndProfile = async () => {
    let slowTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      setError(null);
      setIsLoading(true);
      setIsSessionDelayed(false);

      slowTimer = setTimeout(() => {
        setIsSessionDelayed(true);
      }, 5000);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking profile:", profileError);
          setError("profile");
          setHasProfile(false);
        } else {
          setHasProfile(!!profile);
          setError(null);
          setRetryCount(0);
        }
      } else if (sessionError) {
        console.error("Session error:", sessionError);
        setError("auth");
        setIsAuthenticated(false);
        setHasProfile(false);
      } else {
        setError(null);
        setIsAuthenticated(false);
        setHasProfile(false);
        setRetryCount(0);
      }
    } catch (error: any) {
      console.error("Error in auth check:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("network");
      } else {
        setError("auth");
      }

      setIsAuthenticated(false);
      setHasProfile(false);
    } finally {
      if (slowTimer) {
        clearTimeout(slowTimer);
      }
      setIsLoading(false);
      setIsSessionDelayed(false);
    }
  };

  const handleRetry = () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    checkAuthAndProfile();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    let mounted = true;

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        setIsAuthenticated(false);
        setHasProfile(false);
        setError(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        setIsAuthenticated(true);
        // Check profile again
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
        if (mounted) {
          setHasProfile(!!profile);
          setError(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-muted-foreground text-lg">
            {retryCount > 0
              ? `Retrying... (${retryCount})`
              : isSessionDelayed
                ? "Still verifying your session…"
                : "Loading..."}
          </div>
          <div className="text-sm text-muted-foreground">
            {isSessionDelayed
              ? "This is taking longer than usual. You can wait here—we're still working on it."
              : "Checking authentication status"}
          </div>
          {isSessionDelayed && (
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleRetry} className="gap-2 justify-center">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={handleRefresh} className="gap-2 justify-center">
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    const getErrorMessage = () => {
      switch (error) {
        case 'network':
          return "Network connection error. Please check your internet connection.";
        case 'auth':
          return "Authentication error. There was a problem verifying your session.";
        case 'profile':
          return "Profile error. There was a problem loading your user profile.";
        default:
          return "An unexpected error occurred during authentication.";
      }
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Authentication Error</h2>
            <p className="text-muted-foreground">{getErrorMessage()}</p>
          </div>

          <div className="space-y-3">
            {retryCount < 3 && (
              <Button onClick={handleRetry} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again {retryCount > 0 && `(${retryCount}/3)`}
              </Button>
            )}

            <Button variant="outline" onClick={handleRefresh} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            If this problem persists, please contact support.
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasProfile) {
    // Redirect to landing page, preserving the intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

