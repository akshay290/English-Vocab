import React from "react";
import { Switch, Route } from "wouter";
import { AuthProvider } from "./lib/auth";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./pages/Dashboard";
import { Collections } from "./pages/Collections";
import { Vocabulary } from "./pages/Vocabulary";
import { Tests } from "./pages/Tests";
import { ActiveTest } from "./pages/ActiveTest";
import { TestResult } from "./pages/TestResult";
import { Revision } from "./pages/Revision";
import { Leaderboard } from "./pages/Leaderboard";
import { Admin } from "./pages/Admin";
import { Login } from "./pages/Login";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {children}
      </main>
      <footer className="border-t py-6 bg-card text-muted-foreground text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>SSC Vocabulary Master © 2027 • High-Yield Preparation Platform</span>
          <span>1,281 Illustrated Idioms & 2,027 One-Word Substitutions</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* Specific outer routes */}
        <Route path="/admin">
          <AppLayout>
            <Admin />
          </AppLayout>
        </Route>

        <Route path="/tests/active/:id">
          <AppLayout>
            <ActiveTest />
          </AppLayout>
        </Route>

        <Route path="/tests/result/:id">
          <AppLayout>
            <TestResult />
          </AppLayout>
        </Route>

        {/* Catch-all app layout routes */}
        <Route>
          <AppLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/collections" component={Collections} />
              <Route path="/vocabulary" component={Vocabulary} />
              <Route path="/browse" component={Vocabulary} />
              <Route path="/tests" component={Tests} />
              <Route path="/revision" component={Revision} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Login} />
              <Route>
                <div className="text-center py-20 space-y-4">
                  <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
                  <p className="text-sm text-muted-foreground">The requested route does not exist.</p>
                  <a href="/" className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
                    Return to Dashboard
                  </a>
                </div>
              </Route>
            </Switch>
          </AppLayout>
        </Route>
      </Switch>
    </AuthProvider>
  );
}
