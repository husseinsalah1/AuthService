import { UserStatus, UserType } from '@/modules/users/enums';

export class ListUsersQuery {
    page?: number = 1;
    limit?: number = 10;
    search?: string;
    status?: UserStatus;
    userType?: UserType;
    roleId?: string;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
}
