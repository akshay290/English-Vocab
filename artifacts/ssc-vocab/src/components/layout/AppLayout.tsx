import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { BookOpen } from 'lucide-react';
import { Link } from 'wouter';

export function Footer() {
  const fullStackEnabled = import.meta.env.VITE_ENABLE_FULL_STACK === 'true';
  return (
    <footer className="border-t bg-muted/40 py-8 md:py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1 rounded-md">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold">English Vocab</span>
          </Link>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Illustrated English and Hindi meanings for every word and idiom.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/vocabulary" className="hover:text-primary transition-colors">Browse collection</Link>
          {fullStackEnabled && <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>}
          {fullStackEnabled && <Link href="/auth/login" className="hover:text-primary transition-colors">Login</Link>}
        </div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      <main className="flex-1 w-full relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
