import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Route } from 'wouter';
import { ComponentType } from 'react';

type AdminRouteProps = {
  component: ComponentType<any>;
  path: string;
};

export function AdminRoute({ component: Component, path }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="min-h-[100dvh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          );
        }

        if (!isAuthenticated) {
          return <Redirect to="/admin" />;
        }

        if (!isAdmin) {
          return <Redirect to="/dashboard" />;
        }

        return <Component params={params} />;
      }}
    </Route>
  );
}
