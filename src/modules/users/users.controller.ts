import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException, Query, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { ListUsersQueryDto, UpdateUserDto } from '@/modules/users/dtos';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { CurrentUser, Permissions } from '@/shared/decorators';
import { UserResponse } from '@/modules/users/types/user-response.type';
import { PermissionKey } from '@/modules/permissions/enums';
import { UserType } from '@/modules/users/enums';
import { UsersRequestMapper } from '@/modules/users/mappers/users-request.mapper';
import { UserMapper } from '@/modules/users/mappers/user.mapper';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    private enforceSelfAccessForBasicRoles(currentUser: UserResponse, targetUserId: string): void {
        const requiresSelfAccess =
            currentUser?.userType === UserType.USER || currentUser?.userType === UserType.SUPPLIER;
        if (requiresSelfAccess && currentUser.id !== targetUserId) {
            throw new ForbiddenException('You can only access your own user record');
        }
    }




    @Permissions(PermissionKey.USERS_LIST)
    @Get()
    findAll(@Query() query: ListUsersQueryDto) {
        const listUsersQuery = UsersRequestMapper.toListUsersQuery(query);
        return this.usersService.findAll(listUsersQuery);
    }

    @Permissions(PermissionKey.USERS_READ)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.findById(id);
    }

    @Permissions(PermissionKey.USERS_UPDATE)
    @Patch(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        const command = UsersRequestMapper.toUpdateUserCommand(dto);
        return this.usersService.update(id, command).then((user) => UserMapper.toResponse(user));
    }

    @Permissions(PermissionKey.USERS_DELETE)
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.softDelete(id);
    }
}