import { AuthTokens } from '@/modules/auth/interfaces/auth-tokens.interface';
import { User } from '@/modules/users/entities/user.entity';

export interface AuthResponse {
    user: Omit<User, 'password' | 'emailVerificationToken' | 'passwordResetToken'>;
    tokens: AuthTokens;
}