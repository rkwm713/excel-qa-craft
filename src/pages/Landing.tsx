import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { supabase } from "@/integrations/supabase/client";
import techservLogo from "@/assets/techserv-logo.png";
import { Shield, Lock, ArrowRight } from "lucide-react";

export default function Landing() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          
          if (profile) {
            // User is authenticated and has profile, redirect to dashboard
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLoginSuccess = async (user: any) => {
    // Check if user has a profile
    const { data: profile, error } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking profile:", error);
      return;
    }

    if (profile) {
      // User has profile, redirect to dashboard
      navigate("/dashboard");
    } else {
      // User doesn't have profile, show message
      alert("Your account does not have a profile. Please contact an administrator to set up your profile.");
      await supabase.auth.signOut();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={techservLogo} 
              alt="TechServ" 
              className="h-24 w-auto"
            />
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold font-saira uppercase tracking-wide text-primary">
              QA Review Tool
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-neuton max-w-2xl mx-auto">
              Secure access to quality assurance review management
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-8">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border">
              <Shield className="w-8 h-8 text-primary" />
              <h3 className="font-saira font-semibold text-lg">Secure Access</h3>
              <p className="text-sm text-muted-foreground font-neuton">
                Protected by authentication
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border">
              <Lock className="w-8 h-8 text-primary" />
              <h3 className="font-saira font-semibold text-lg">Profile Required</h3>
              <p className="text-sm text-muted-foreground font-neuton">
                Only authorized users can access
              </p>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border">
              <ArrowRight className="w-8 h-8 text-primary" />
              <h3 className="font-saira font-semibold text-lg">Get Started</h3>
              <p className="text-sm text-muted-foreground font-neuton">
                Login to continue
              </p>
            </div>
          </div>

          {/* Login Button */}
          <div className="pt-8">
            <Button
              onClick={() => setShowLoginDialog(true)}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg px-8 py-6 h-auto"
            >
              Login to Continue
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-muted-foreground font-neuton mt-8">
            You must have an authorized profile to access this application.
          </p>
        </div>
      </div>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

