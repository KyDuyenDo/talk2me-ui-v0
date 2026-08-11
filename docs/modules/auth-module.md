# Module: Authentication

> Supabase Auth cho Talk2Me: Email/Password + Google OAuth + Session Management.

---

## Setup Supabase Auth

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,  // tự refresh JWT trước khi hết hạn
      persistSession: true,    // lưu session vào localStorage
    }
  }
);
```

---

## useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy session hiện tại khi app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Lắng nghe thay đổi auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: 'google' }),
    signOut: () => supabase.auth.signOut(),
  };
}
```

---

## AuthModal Component (Junior task)

```tsx
// src/components/AuthModal.tsx

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        onClose();
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        // Supabase gửi confirmation email
        setError('Vui lòng kiểm tra email để xác nhận tài khoản!');
      }
    } catch (err: any) {
      setError(mapAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open={isOpen} className="modal">
      {/* form login/register */}
    </dialog>
  );
}

// Map lỗi Supabase sang tiếng Việt
function mapAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email hoặc mật khẩu không đúng.',
    'User already registered': 'Email này đã được đăng ký.',
    'Password should be at least 6 characters': 'Mật khẩu cần ít nhất 6 ký tự.',
    'Email rate limit exceeded': 'Quá nhiều lần thử. Vui lòng đợi vài phút.',
  };
  return errorMap[message] ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
}
```

---

## BYOK Key Storage (Security)

```typescript
// BYOK key LUÔN lưu localStorage, KHÔNG BAO GIỜ gửi về DB
const BYOK_KEY = 't2m_openrouter_key';

export function saveBYOKKey(key: string): void {
  localStorage.setItem(BYOK_KEY, key);
  // KHÔNG: supabase.from('profiles').update({ openrouter_key: key })
}

export function getBYOKKey(): string | null {
  return localStorage.getItem(BYOK_KEY);
}

// Tại sao không lưu DB?
// 1. Người dùng đã tin tưởng ta với email/password → đừng đòi thêm key LLM của họ
// 2. Nếu DB bị breach, key người dùng bị lộ → tài khoản OpenRouter của họ mất tiền
// 3. Key trong localStorage chỉ ảnh hưởng device đó → rủi ro thấp hơn nhiều
```

---

## Server-side Auth Verification

```typescript
// Trong mỗi API endpoint, verify JWT token
export async function verifyAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { user: null, error: 'No token' };
  
  // Dùng supabase-js với service_role key (server-side only)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!  // Không bao giờ expose ra client!
  );
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return { user, error };
}
```
