import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import type { User } from '@shared/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User | null> => {
      try {
        const { data } = await api.get('/auth/me');
        return data.data.user as User;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

function useInvalidateAuth() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    void queryClient.invalidateQueries({ queryKey: ['ratings'] });
  };
}

export function useLogin() {
  const navigate = useNavigate();
  const invalidate = useInvalidateAuth();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; rememberMe?: boolean }) => {
      const { data } = await api.post('/auth/login', input);
      return data.data.user as User;
    },
    onSuccess: user => {
      invalidate();
      toast.success(`Welcome back, ${user.username}!`);
      navigate('/');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Login failed')),
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const invalidate = useInvalidateAuth();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
    }) => {
      const { data } = await api.post('/auth/register', input);
      return data.data.user as User;
    },
    onSuccess: user => {
      invalidate();
      toast.success(`Welcome to CineMatch, ${user.username}!`);
      navigate('/');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Registration failed')),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out');
      navigate('/');
    },
  });
}

export function errorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const resp = (
      e as {
        response?: { data?: { error?: { message?: string; details?: { message: string }[] } } };
      }
    ).response;
    const details = resp?.data?.error?.details?.map(d => d.message).join(', ');
    return details ?? resp?.data?.error?.message ?? fallback;
  }
  return fallback;
}
