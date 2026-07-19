import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, LayoutDashboard, Users, Book, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/vocabulary', label: 'Vocabulary', icon: Book },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/20">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b h-16 flex items-center justify-between md:justify-start gap-2">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="bg-destructive text-destructive-foreground p-1.5 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="md:hidden">
            <Link href="/">Exit</Link>
          </Button>
        </div>
        <div className="flex-1 py-4 px-3 space-y-1 overflow-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/">Back to App</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
