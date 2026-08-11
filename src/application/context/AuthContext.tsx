import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../../core/entities';
import { LocalAuthRepository } from '../../infrastructure/storage/LocalAuthRepository';
import { getAuthUser } from '../../infrastructure/api/talk2meApi';

const authRepo = new LocalAuthRepository();

export interface AuthModalState {
  isOpen: boolean;
  featureTitle?: string;
  featureDescription?: string;
  pendingAction?: () => void;
}

interface AuthContextType {
  user: UserProfile | null;
  authModal: AuthModalState;
  authInitialMode: 'login' | 'signup';
  authRedirectReason: string;
  isAuthPopupOpen: boolean;
  requireAuth: (action: () => void, title?: string, description?: string) => void;
  openAuthPopup: (mode?: 'login' | 'signup', reason?: string) => void;
  closeAuthPopup: () => void;
  closeAuthModal: () => void;
  handleAuthConfirmModal: (mode: 'login' | 'signup') => void;
  loginSuccess: (newUser: UserProfile) => void;
  login: (newUser: UserProfile) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => authRepo.getUser());

  const [authModal, setAuthModal] = useState<AuthModalState>({ isOpen: false });
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [authRedirectReason, setAuthRedirectReason] = useState<string>('');
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      authRepo.saveUser(user);
    } else {
      authRepo.removeUser();
    }
  }, [user]);

  // Global listener for 401 Unauthorized / Token Expiration events
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const reason = customEvent.detail || 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.';
      setUser(null);
      authRepo.removeUser();
      localStorage.removeItem('talk2me_jwt_token');
      localStorage.removeItem('talk2me_refresh_token');
      openAuthPopup('login', reason);
    };

    window.addEventListener('talk2me_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('talk2me_unauthorized', handleUnauthorized);
  }, []);

  // Verify active JWT token session with backend on app load
  useEffect(() => {
    const token = localStorage.getItem('talk2me_jwt_token');
    if (token) {
      getAuthUser()
        .then((updatedProfile) => {
          setUser(updatedProfile);
        })
        .catch((err) => {
          console.warn('[Session Verification] Token expired or invalid:', err);
          setUser(null);
          authRepo.removeUser();
          localStorage.removeItem('talk2me_jwt_token');
          localStorage.removeItem('talk2me_refresh_token');
        });
    }
  }, []);

  const requireAuth = (
    action: () => void,
    title = 'Tính năng này yêu cầu đăng nhập',
    description = 'Đăng nhập hoặc đăng ký tài khoản Talk2Me để lưu tiến độ học tập, khởi tạo khóa học AI cá nhân và mở khóa đầy đủ quyền lợi.'
  ) => {
    if (user) {
      action();
    } else {
      setAuthModal({
        isOpen: true,
        featureTitle: title,
        featureDescription: description,
        pendingAction: action,
      });
    }
  };

  const openAuthPopup = (mode: 'login' | 'signup' = 'login', reason?: string) => {
    setAuthInitialMode(mode);
    setAuthRedirectReason(reason || '');
    setIsAuthPopupOpen(true);
  };

  const closeAuthPopup = () => {
    setIsAuthPopupOpen(false);
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false });
  };

  const handleAuthConfirmModal = (mode: 'login' | 'signup') => {
    const reason = authModal.featureTitle || 'Truy cập tính năng phân quyền';
    setAuthModal({ isOpen: false });
    openAuthPopup(mode, reason);
  };

  const loginSuccess = (newUser: UserProfile) => {
    setUser(newUser);
    setIsAuthPopupOpen(false);
    if (authModal.pendingAction) {
      const action = authModal.pendingAction;
      setAuthModal({ isOpen: false });
      action();
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('talk2me_jwt_token');
    localStorage.removeItem('talk2me_refresh_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authModal,
        authInitialMode,
        authRedirectReason,
        isAuthPopupOpen,
        requireAuth,
        openAuthPopup,
        closeAuthPopup,
        closeAuthModal,
        handleAuthConfirmModal,
        loginSuccess,
        login: loginSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
