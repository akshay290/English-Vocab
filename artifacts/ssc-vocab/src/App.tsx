import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import AdminLogin from '@/pages/auth/AdminLogin';
import Dashboard from '@/pages/Dashboard';
import VocabularyBrowser from '@/pages/vocabulary/Browser';
import WordDetail from '@/pages/vocabulary/WordDetail';
import AlphabetBrowser from '@/pages/vocabulary/AlphabetBrowser';
import CategoryBrowser from '@/pages/vocabulary/CategoryBrowser';
import Tests from '@/pages/tests/TestCreate';
import ActiveTest from '@/pages/tests/ActiveTest';
import TestResult from '@/pages/tests/TestResult';
import TestHistory from '@/pages/tests/TestHistory';
import Progress from '@/pages/Progress';
import Revision from '@/pages/Revision';
import Leaderboard from '@/pages/Leaderboard';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminVocabulary from '@/pages/admin/Vocabulary';
import AdminUsers from '@/pages/admin/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={base}>
            <Switch>
              {/* ── Admin Routes (no AppLayout) ───────────────── */}
              <Route path="/admin" component={AdminLogin} />
              <AdminRoute path="/admin/dashboard" component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
              <AdminRoute path="/admin/vocabulary" component={() => <AdminLayout><AdminVocabulary /></AdminLayout>} />
              <AdminRoute path="/admin/users" component={() => <AdminLayout><AdminUsers /></AdminLayout>} />

              {/* ── Public + Protected App Routes (with AppLayout) ─ */}
              <Route>
                <AppLayout>
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/auth/login" component={Login} />
                    <Route path="/auth/register" component={Register} />

                    <Route path="/vocabulary" component={VocabularyBrowser} />
                    <Route path="/vocabulary/alphabet/:letter" component={AlphabetBrowser} />
                    <Route path="/vocabulary/category/:category" component={CategoryBrowser} />
                    <Route path="/vocabulary/:id" component={WordDetail} />
                    <Route path="/leaderboard" component={Leaderboard} />

                    <ProtectedRoute path="/dashboard" component={Dashboard} />
                    <ProtectedRoute path="/tests/history" component={TestHistory} />
                    <ProtectedRoute path="/tests/:id/result" component={TestResult} />
                    <ProtectedRoute path="/tests/:id" component={ActiveTest} />
                    <ProtectedRoute path="/tests" component={Tests} />
                    <ProtectedRoute path="/progress" component={Progress} />
                    <ProtectedRoute path="/revision" component={Revision} />

                    <Route component={NotFound} />
                  </Switch>
                </AppLayout>
              </Route>
            </Switch>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
