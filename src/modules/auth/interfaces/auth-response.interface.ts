import { AuthTokens } from './auth-tokens.interface';
import { User } from '../../users/entities/user.entity';

export interface AuthResponse {
    user: Omit<User, 'password' | 'emailVerificationToken' | 'passwordResetToken'>;
    tokens: AuthTokens;
}