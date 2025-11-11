import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type UserProfile = Tables<"users">;

interface AuthContextValue {
  user: User;
  profile: UserProfile;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a ProtectedLayout");
  }
  return context;
};

export const ProtectedLayout = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAuthState = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        if (isMountedRef.current) {
          setAuthUser(null);
          setProfile(null);
        }
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (isMountedRef.current) {
        setAuthUser(user);
        if (profileError || !profileData) {
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      }
    } catch (loadError) {
      console.error("Error loading auth state:", loadError);
      if (isMountedRef.current) {
        setAuthUser(null);
        setProfile(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAuthState();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAuthState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAuthState]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    await loadAuthState();
  }, [loadAuthState]);

  const contextValue = useMemo(() => {
    if (!authUser || !profile) return undefined;
    return {
      user: authUser,
      profile,
      refresh: loadAuthState,
      signOut: handleSignOut,
    };
  }, [authUser, profile, loadAuthState, handleSignOut]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!authUser || !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <AuthContext.Provider value={contextValue!}>
      <Outlet />
    </AuthContext.Provider>
  );
};

