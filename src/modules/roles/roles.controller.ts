import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dtos';
import { Permissions } from 'src/shared/decorators';
import { AssignPermissionsDto } from './dtos/assign-permissions.dto';
import { PermissionKey } from '../permissions/enums';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Permissions(PermissionKey.ROLES_CREATE)
    @Post()
    create(@Body() dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get('active')
    findActive() {
        return this.rolesService.findActive();
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOneWithPermissions(id);
    }

    @Permissions(PermissionKey.ROLES_UPDATE)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @Permissions(PermissionKey.ROLES_DELETE)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }

    @Permissions(PermissionKey.ROLES_UPDATE)
    @Post(':id/permissions')
    assignPermissions(
        @Param('id') id: string,
        @Body() dto: AssignPermissionsDto,
    ) {
        return this.rolesService.assignPermissions(id, dto.permissionIds);
    }
}