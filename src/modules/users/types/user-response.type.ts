import { UserStatus } from '../enums/user-status.enum';

export type UserRoleResponse = {
    id: string;
    name: string;
    key: string;
};

export type UserResponse = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string | null;
    password: string | null,
    countryCode: string | null;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    status: UserStatus;
    role?: UserRoleResponse | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};