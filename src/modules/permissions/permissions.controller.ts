import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { CreatePermissionDto } from '@/modules/permissions/dtos/create-permission.dto';
import { Permissions } from '@/shared/decorators';
import { PermissionKey } from '@/modules/permissions/enums';
import { PermissionsRequestMapper } from '@/modules/permissions/mappers/permissions-request.mapper';

@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Permissions(PermissionKey.PERMISSIONS_CREATE)
    @Post()
    create(@Body() dto: CreatePermissionDto) {
        const command = PermissionsRequestMapper.toCreatePermissionCommand(dto);
        return this.permissionsService.create(command);
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @Get()
    findAll() {
        return this.permissionsService.findAll();
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @Get('active')
    findActive() {
        return this.permissionsService.findActive();
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.permissionsService.findOne(id);
    }
}