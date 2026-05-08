import { UserStatus } from '@/modules/users/enums';

export class UpdateUserCommand {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    countryCode?: string;
    status?: UserStatus;
    passwordResetToken?: string | null;
    passwordResetExpiresAt?: Date | null;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
}
