import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { RolesService } from '@/modules/roles/roles.service';
import { CreateRoleDto, ListRolesQueryDto, UpdateRoleDto } from '@/modules/roles/dtos';
import { Permissions } from '@/shared/decorators';
import { AssignPermissionsDto } from '@/modules/roles/dtos/assign-permissions.dto';
import { PermissionKey } from '@/modules/permissions/enums';
import { RolesRequestMapper } from '@/modules/roles/mappers/roles-request.mapper';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Permissions(PermissionKey.ROLES_CREATE)
    @Post()
    create(@Body() dto: CreateRoleDto) {
        const command = RolesRequestMapper.toCreateRoleCommand(dto);
        return this.rolesService.create(command);
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get()
    findAll(@Query() query: ListRolesQueryDto) {
        const { page = 1, limit = 10 } = query;
        return this.rolesService.findAll(page, limit);
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get('active')
    findActive() {
        return this.rolesService.findActive();
    }

    @Permissions(PermissionKey.ROLES_READ)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.findOneWithPermissions(id);
    }

    @Permissions(PermissionKey.ROLES_UPDATE)
    @Patch(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateRoleDto) {
        const command = RolesRequestMapper.toUpdateRoleCommand(dto);
        return this.rolesService.update(id, command);
    }

    @Permissions(PermissionKey.ROLES_DELETE)
    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.remove(id);
    }

    @Permissions(PermissionKey.ROLES_UPDATE)
    @Post(':id/permissions')
    assignPermissions(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: AssignPermissionsDto,
    ) {
        return this.rolesService.assignPermissions(id, dto.permissionIds);
    }
}