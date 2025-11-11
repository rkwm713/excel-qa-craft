import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import techservLogo from "@/assets/techserv-logo.png";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "./ProtectedLayout";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/reviews", label: "Reviews" },
  { to: "/new-review", label: "New Review" },
];

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <img src={techservLogo} alt="TechServ" className="h-12 w-auto" />
            <nav className="flex items-center gap-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  activeClassName="text-primary"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {profile.full_name ?? profile.username}
              </p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

