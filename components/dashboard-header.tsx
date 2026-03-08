"use client";

import { Activity, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserSession } from "@/lib/types";

interface DashboardHeaderProps {
  user: UserSession;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-card-foreground">
            Uptime Monitor
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 text-sm text-muted-foreground hover:text-card-foreground"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url || "/placeholder.svg"}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await fetch("/api/auth/signout", { method: "POST" });
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
