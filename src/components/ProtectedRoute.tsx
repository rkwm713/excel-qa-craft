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
    const checkAuthAndProfile = async () => {
      try {
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setIsAuthenticated(false);
          setHasProfile(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user has a profile in the users table
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking profile:", profileError);
          setHasProfile(false);
        } else {
          setHasProfile(!!profile);
        }
      } catch (error) {
        console.error("Error in auth check:", error);
        setIsAuthenticated(false);
        setHasProfile(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
        setHasProfile(!!profile);
      }
    });

    return () => {
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

