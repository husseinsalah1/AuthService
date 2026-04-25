import { User } from '../entities/user.entity';
import { UserResponse } from '../types/user-response.type';

export class UserMapper {
    static toResponse(user: User): UserResponse {
        return {
            id: user.id,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email ?? null,
            password: user.password,
            phoneNumber: user.phoneNumber ?? null,
            countryCode: user.countryCode ?? null,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            status: user.status,

            role: user.role
                ? {
                    id: user.role.id,
                    name: user.role.name,
                    key: user.role.key,
                }
                : null,

            lastLoginAt: user.lastLoginAt ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    static toResponseList(users: User[]): UserResponse[] {
        return users.map((user) => this.toResponse(user));
    }

    private static getFullName(user: User): string | null {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

        return fullName || null;
    }
}