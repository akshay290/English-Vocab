import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import {
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  BrainCircuit,
  Trophy,
  Shield,
  Menu,
  X,
  Flame,
  User as UserIcon,
  LogOut,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: BookOpen },
    {
      href: "/collections",
      label: "Illustrated 2027",
      icon: ImageIcon,
      badge: "1,281",
      badgeColor: "bg-emerald-600 text-white",
    },
    { href: "/vocabulary", label: "Vocabulary", icon: Sparkles },
    { href: "/tests", label: "MCQ Tests", icon: CheckCircle2 },
    { href: "/revision", label: "Spaced Revision", icon: BrainCircuit },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/admin", label: "Admin", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
                  SSC Vocab Master
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    2027 Edition
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  CGL • CHSL • CPO • MTS • Banking
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User & Action Bar */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>4-Day Streak</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted border text-xs font-medium">
                  <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="max-w-[110px] truncate">{user.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 text-[11px] font-semibold border border-amber-200">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>4d</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card px-4 pt-3 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-3 border-t flex items-center justify-between">
            {user ? (
              <>
                <span className="text-xs text-muted-foreground">{user.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-destructive flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
