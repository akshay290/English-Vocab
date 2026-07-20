import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, Menu, Shield, UserCircle, X } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/vocabulary', label: 'Vocabulary' },
        { href: '/tests', label: 'Tests' },
        { href: '/progress', label: 'Progress' },
        { href: '/leaderboard', label: 'Leaderboard' },
        { href: '/revision', label: 'Revision' },
      ]
    : [
        { href: '/vocabulary', label: 'Browse Words' },
        { href: '/leaderboard', label: 'Leaderboard' },
      ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">SSC Vocab Master</span>
          <span className="font-bold text-lg sm:hidden">Vocab Master</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith(link.href) && link.href !== '/' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`text-sm font-medium transition-colors flex items-center gap-1 hover:text-destructive ${
                location.startsWith('/admin') ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="cursor-pointer w-full text-primary font-medium">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-medium p-2 rounded-md transition-colors ${
                  location.startsWith(link.href) && link.href !== '/' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t pt-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="px-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {user?.role === 'admin' && (
                  <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block p-2 text-sm font-medium text-primary">
                    Admin Panel
                  </Link>
                )}
                <Button variant="outline" className="w-full justify-start text-destructive" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full justify-center">
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
