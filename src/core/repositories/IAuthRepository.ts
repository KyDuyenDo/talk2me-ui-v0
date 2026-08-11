import { UserProfile } from '../entities';

export interface IAuthRepository {
  getUser(): UserProfile | null;
  saveUser(user: UserProfile): void;
  removeUser(): void;
}
