import { ListUsersQueryDto, UpdateUserDto } from '@/modules/users/dtos';
import { ListUsersQuery } from '@/modules/users/queries/list-users.query';
import { UpdateUserCommand } from '@/modules/users/commands/update-user.command';

export class UsersRequestMapper {
    static toListUsersQuery(dto: ListUsersQueryDto): ListUsersQuery {
        return {
            page: dto.page,
            limit: dto.limit,
            search: dto.search,
            status: dto.status,
            userType: dto.userType,
            roleId: dto.roleId,
            isPhoneVerified: dto.isPhoneVerified,
            isEmailVerified: dto.isEmailVerified,
        };
    }

    static toUpdateUserCommand(dto: UpdateUserDto): UpdateUserCommand {
        return {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: dto.password,
            phoneNumber: dto.phoneNumber,
            countryCode: dto.countryCode,
        };
    }
}
