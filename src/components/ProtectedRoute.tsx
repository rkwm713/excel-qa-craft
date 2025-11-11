import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkAuthAndProfile = async (retryCount = 0) => {
      try {
        // Set a longer timeout to prevent false negatives (15 seconds)
        timeoutId = setTimeout(() => {
          if (mounted) {
            if (retryCount < 1) {
              // Retry once before giving up
              console.warn("Auth check timeout - retrying...");
              checkAuthAndProfile(retryCount + 1);
            } else {
              console.error("Auth check timeout after retry - assuming not authenticated");
              setIsAuthenticated(false);
              setHasProfile(false);
              setIsLoading(false);
            }
          }
        }, 15000); // 15 second timeout (increased from 5)

        // Check authentication with session first (faster)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (timeoutId) clearTimeout(timeoutId);

        if (!mounted) return;
        
        // If we have a session, user is authenticated
        if (session?.user) {
          setIsAuthenticated(true);

          // Check if user has a profile in the users table
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!mounted) return;

          if (profileError) {
            console.error("Error checking profile:", profileError);
            setHasProfile(false);
          } else {
            setHasProfile(!!profile);
          }
        } else if (sessionError) {
          console.error("Session error:", sessionError);
          setIsAuthenticated(false);
          setHasProfile(false);
        } else {
          // No session, not authenticated
          setIsAuthenticated(false);
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Error in auth check:", error);
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) {
          setIsAuthenticated(false);
          setHasProfile(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === "SIGNED_OUT" || !session) {
        setIsAuthenticated(false);
        setHasProfile(false);
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
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !hasProfile) {
    // Redirect to landing page, preserving the intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

