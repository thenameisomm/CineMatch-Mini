import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { useRegister } from '@features/auth/hooks/use-auth';

export function RegisterPage() {
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="container mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
      <p className="mb-6 text-muted-foreground">Start tracking, rating, and discovering.</p>
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
            <label className="mb-1 block text-sm font-medium" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="movie_fan"
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
              placeholder="Min 8 chars, upper + lower + number + symbol"
            />
          </div>
          <Button
            className="w-full"
            disabled={register.isPending}
            onClick={() => register.mutate({ email, username, password })}
          >
            {register.isPending ? 'Creating…' : 'Register'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Have an account?{' '}
            <Link to="/auth/login" className="text-primary underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
