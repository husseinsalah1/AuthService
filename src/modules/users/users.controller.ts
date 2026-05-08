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
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth('access-token')
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
    @ApiOperation({ summary: 'List users with pagination and filters' })
    @ApiOkResponse({ description: 'Users fetched successfully' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
    @ApiForbiddenResponse({ description: 'Missing required permission' })
    @Get()
    findAll(@Query() query: ListUsersQueryDto) {
        const listUsersQuery = UsersRequestMapper.toListUsersQuery(query);
        return this.usersService.findAll(listUsersQuery);
    }

    @Permissions(PermissionKey.USERS_READ)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ description: 'User fetched successfully' })
    @ApiForbiddenResponse({ description: 'Access denied to target user or permission missing' })
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.findById(id);
    }

    @Permissions(PermissionKey.USERS_UPDATE)
    @ApiOperation({ summary: 'Update user by ID' })
    @ApiOkResponse({ description: 'User updated successfully' })
    @ApiForbiddenResponse({ description: 'Access denied to target user or permission missing' })
    @Patch(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        const command = UsersRequestMapper.toUpdateUserCommand(dto);
        return this.usersService.update(id, command).then((user) => UserMapper.toResponse(user));
    }

    @Permissions(PermissionKey.USERS_DELETE)
    @ApiOperation({ summary: 'Soft delete user by ID' })
    @ApiOkResponse({ description: 'User soft deleted successfully' })
    @ApiForbiddenResponse({ description: 'Access denied to target user or permission missing' })
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.softDelete(id);
    }
}