import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAdminLogin } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

const adminLoginSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const adminLoginMutation = useAdminLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = (data: z.infer<typeof adminLoginSchema>) => {
    adminLoginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          login(response);
          toast({ title: 'Admin Access Granted' });
          setLocation('/admin/dashboard');
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: error?.data?.error || 'Invalid admin password',
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl border-destructive/20 border-2">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive/10 text-destructive p-3 rounded-full">
              <Shield className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Restricted area. Please enter admin password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full h-11 text-base mt-2" 
              disabled={isSubmitting || adminLoginMutation.isPending}
            >
              {isSubmitting || adminLoginMutation.isPending ? 'Verifying...' : 'Access Admin Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
