import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 pattern-blue-gradient opacity-80" aria-hidden="true" />
      <div className="absolute inset-0 pattern-electric-trail mix-blend-screen opacity-20" aria-hidden="true" />
      <div className="absolute inset-y-0 left-1/2 hidden w-2/3 -translate-x-1/2 blur-3xl md:block pattern-bolt-glow opacity-30" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-20 px-6 py-20">
        <section className="flex w-full flex-col items-center gap-10 rounded-[var(--radius-lg)] border border-[hsl(var(--border))]/60 bg-white/90 p-12 text-center shadow-brand-lg backdrop-blur">
          <TechServLogo variant="primary" tone="color-on-dark" width={220} />
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsla(var(--color-light)/0.6)] px-5 py-1.5 font-saira text-[11px] uppercase tracking-[0.16em] text-[hsl(var(--color-secondary))]">
              TechServ QA Review Platform
            </span>
            <h1 className="font-saira text-3xl uppercase tracking-[0.08em] text-[hsl(var(--color-primary))] md:text-4xl">
              Quality Assurance for Every Work Point
            </h1>
            <p className="font-neuton text-lg leading-relaxed text-[hsl(var(--color-secondary))] md:text-xl">
              Sign in with your TechServ credentials to review designer uploads, coordinate QA tasks, and prepare
              field-ready packages. <span className="font-semibold text-[hsl(var(--color-primary))]">Scalability and reliability when and where you need it.</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" variant="cta" className="px-10" onClick={() => setShowLoginDialog(true)}>
              Login to Continue
            </Button>
            <p className="font-neuton text-sm text-[hsl(var(--color-secondary))]">
              Authorized TechServ access is required to enter the QA environment.
            </p>
          </div>
        </section>

        <section className="grid w-full gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="border-[hsl(var(--border))]/70 bg-white/90 backdrop-blur">
              <CardContent className="flex h-full flex-col items-center gap-4 px-6 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsla(var(--color-primary)/0.12)] text-[hsl(var(--color-primary))] shadow-brand-sm">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-saira text-xs uppercase tracking-[0.12em] text-[hsl(var(--color-dark))]">
                  {title}
                </span>
                <p className="font-neuton text-sm text-[hsl(var(--color-secondary))]">{copy}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
