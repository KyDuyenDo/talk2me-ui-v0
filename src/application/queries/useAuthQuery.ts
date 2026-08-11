import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile } from '../../core/entities';
import { API_BASE_URL } from '../../infrastructure/config';

const FASTAPI_URL = `${API_BASE_URL}/auth`;

export const useCheckEmailMutation = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`${FASTAPI_URL}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error('Không thể kiểm tra email.');
      }
      return res.json() as Promise<{ email: string; exists: boolean; user_name?: string }>;
    },
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch(`${FASTAPI_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Mật khẩu không chính xác.');
      }
      return data as { access_token: string; refresh_token: string; user: UserProfile };
    },
    onSuccess: (data) => {
      if (data.access_token) {
        localStorage.setItem('talk2me_jwt_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('talk2me_refresh_token', data.refresh_token);
      }
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; name: string; target_goal?: string }) => {
      const res = await fetch(`${FASTAPI_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Đăng ký thất bại.');
      }
      return data as { access_token: string; refresh_token: string; user: UserProfile };
    },
    onSuccess: (data) => {
      if (data.access_token) {
        localStorage.setItem('talk2me_jwt_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('talk2me_refresh_token', data.refresh_token);
      }
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
};

export const useCurrentUserQuery = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<UserProfile | null> => {
      const token = localStorage.getItem('talk2me_jwt_token');
      if (!token) return null;
      try {
        const res = await fetch(`${FASTAPI_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return (await res.json()) as UserProfile;
        }
      } catch {
        return null;
      }
      return null;
    },
  });
};
