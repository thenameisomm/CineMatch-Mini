import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { useLogin } from '@features/auth/hooks/use-auth';

export function LoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="container mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Welcome back</h1>
      <p className="mb-6 text-muted-foreground">Log in to your CineMatch account.</p>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            className="w-full"
            disabled={login.isPending}
            onClick={() => login.mutate({ email, password })}
          >
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/auth/register" className="text-primary underline">
              Register
            </Link>
          </p>
          <p className="rounded bg-muted p-2 text-center text-xs text-muted-foreground">
            Demo account: student@cinematch.mini / Student@1234
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
