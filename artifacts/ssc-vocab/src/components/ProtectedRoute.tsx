import { useAuth } from '@/contexts/AuthContext';
import { Redirect, Route, RouteProps } from 'wouter';
import { ComponentType } from 'react';

type ProtectedRouteProps = {
  component: ComponentType<any>;
  path: string;
};

export function ProtectedRoute({ component: Component, path }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

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
          return <Redirect to="/auth/login" />;
        }

        return <Component params={params} />;
      }}
    </Route>
  );
}
