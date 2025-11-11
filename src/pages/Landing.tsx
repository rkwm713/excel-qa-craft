import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { supabase } from "@/integrations/supabase/client";
import { TechServLogo } from "@/components/brand/TechServLogo";
import { Shield, Map, FileSpreadsheet } from "lucide-react";

export default function Landing() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setIsCheckingAuth(false);
        }, 5000); // 5 second timeout

        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        clearTimeout(timeoutId);

        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (profile) {
            navigate("/dashboard", { replace: true });
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
      navigate("/dashboard");
    } else {
      alert("Your account does not have a profile. Please contact an administrator to set up your profile.");
      await supabase.auth.signOut();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="absolute inset-0 gradient-blue opacity-20" aria-hidden="true" />
        <div className="relative z-10 animate-pulse font-neuton text-base text-[hsl(var(--techserv-gray))]">
          Preparing your workspace…
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Shield,
      title: "Secure Access",
      copy: "Supabase authentication protects TechServ projects.",
    },
    {
      icon: Map,
      title: "Field Context",
      copy: "View KMZ overlays and map annotations in one place.",
    },
    {
      icon: FileSpreadsheet,
      title: "Designer Packages",
      copy: "Upload Excel deliverables and launch QA reviews immediately.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(var(--background))] px-6 py-16 text-foreground">
      <div className="absolute inset-0 gradient-blue opacity-15" aria-hidden="true" />
      <div className="absolute inset-y-0 left-1/2 hidden w-2/3 -translate-x-1/2 rounded-full bg-[hsl(var(--sky-blue))]/40 blur-3xl md:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-14 text-center">
        <div className="flex w-full flex-col items-center gap-8 rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-white/90 p-10 shadow-brand-lg backdrop-blur">
          <TechServLogo variant="primary" width={200} />
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-[hsl(var(--border))] px-4 py-1.5 font-saira text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--techserv-gray))]">
              TechServ QA Review Platform
            </span>
            <h1 className="font-saira text-3xl uppercase tracking-[0.08em] text-[hsl(var(--primary))] md:text-4xl">
              Quality Assurance for Every Work Point
            </h1>
            <p className="font-neuton text-lg text-[hsl(var(--techserv-gray))] md:text-xl">
              Sign in with your TechServ credentials to review designer uploads, coordinate QA tasks, and prepare
              field-ready packages.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" variant="cta" className="px-8" onClick={() => setShowLoginDialog(true)}>
              Login to Continue
            </Button>
            <p className="font-neuton text-sm text-[hsl(var(--techserv-gray))]">
              Authorized TechServ access is required to enter the QA environment.
            </p>
          </div>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-white/80 px-4 py-6 shadow-brand-sm backdrop-blur"
            >
              <Icon className="h-8 w-8 text-[hsl(var(--primary))]" />
              <span className="font-saira text-xs uppercase tracking-[0.12em] text-[hsl(var(--techserv-black))]">
                {title}
              </span>
              <p className="font-neuton text-xs text-[hsl(var(--techserv-gray))]">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
