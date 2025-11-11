import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon } from "lucide-react";

type UserLike = {
  username?: string | null;
  email?: string | null;
};

type UserProfileMenuProps = {
  user: UserLike | null | undefined;
  onLogin: () => void;
  onLogout: () => void;
};

const getInitials = (user: UserLike | null | undefined) => {
  if (!user) return "TS";
  const source = user.username ?? user.email ?? "";
  if (!source) return "TS";
  const letters = source.replace(/[^a-zA-Z]/g, "").slice(0, 2);
  return letters ? letters.toUpperCase() : "TS";
};

export const UserProfileMenu = ({ user, onLogin, onLogout }: UserProfileMenuProps) => {
  if (!user) {
    return (
      <Button size="sm" variant="outline" onClick={onLogin} className="gap-2">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Login</span>
      </Button>
    );
  }

  const initials = getInitials(user);
  const displayName = user.username ?? user.email ?? "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2 hover:bg-[hsla(var(--color-primary)/0.08)]">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[hsl(var(--color-primary))] text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

