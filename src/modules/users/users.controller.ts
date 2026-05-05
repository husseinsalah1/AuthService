import { Controller, Get, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser, Permissions } from '../../shared/decorators';
import { UserResponse } from './types/user-response.type';
import { PermissionKey } from '../permissions/enums';
import { UserType } from './enums';

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

    @Permissions(PermissionKey.USERS_READ)
    @Get(':id')
    findOne(@Param('id') id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.findById(id);
    }

    @Permissions(PermissionKey.USERS_UPDATE)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.update(id, dto);
    }

    @Permissions(PermissionKey.USERS_DELETE)
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() currentUser: UserResponse) {
        this.enforceSelfAccessForBasicRoles(currentUser, id);
        return this.usersService.softDelete(id);
    }
}