import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useTheme } from "./ThemeProvider";
import { Bell, LogOut, Sun, Moon, User } from "lucide-react";

interface TopbarProps {
  onLogout: () => void;
}

export function Topbar({ onLogout }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full bg-background border-b border-border flex items-center justify-between px-6 h-16">
      {/* Search Bar */}
      <div className="flex-1 max-w-xs">
        <Input type="text" placeholder="Ara..." className="w-full" />
      </div>
      <div className="flex items-center gap-4 ml-4">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs" variant="destructive">3</Badge>
        </Button>
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Açık Tema" : "Koyu Tema"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        {/* Profile Avatar */}
        <Button variant="ghost" size="icon">
          <Avatar>
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        </Button>
        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={onLogout} title="Çıkış Yap">
          <LogOut className="w-5 h-5 text-destructive" />
        </Button>
      </div>
    </header>
  );
} 