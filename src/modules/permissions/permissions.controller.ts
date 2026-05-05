import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { Permissions } from 'src/shared/decorators';
import { PermissionKey } from './enums';

@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Permissions(PermissionKey.PERMISSIONS_CREATE)
    @Post()
    create(@Body() dto: CreatePermissionDto) {
        return this.permissionsService.create(dto);
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
    findOne(@Param('id') id: string) {
        return this.permissionsService.findOne(id);
    }
}