import { UserProfile } from '../../core/entities';
import { IAuthRepository } from '../../core/repositories/IAuthRepository';

const USER_KEY = 't2m_user';

export class LocalAuthRepository implements IAuthRepository {
  getUser(): UserProfile | null {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      return null;
    }
  }

  saveUser(user: UserProfile): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  }

  removeUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to remove user from localStorage', e);
    }
  }
}
