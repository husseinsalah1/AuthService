import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { CreatePermissionDto } from '@/modules/permissions/dtos/create-permission.dto';
import { Permissions } from '@/shared/decorators';
import { PermissionKey } from '@/modules/permissions/enums';
import { PermissionsRequestMapper } from '@/modules/permissions/mappers/permissions-request.mapper';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Permissions(PermissionKey.PERMISSIONS_CREATE)
    @ApiOperation({ summary: 'Create a new permission' })
    @ApiOkResponse({ description: 'Permission created successfully' })
    @ApiForbiddenResponse({ description: 'Missing required permission' })
    @Post()
    create(@Body() dto: CreatePermissionDto) {
        const command = PermissionsRequestMapper.toCreatePermissionCommand(dto);
        return this.permissionsService.create(command);
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @ApiOperation({ summary: 'List all permissions' })
    @ApiOkResponse({ description: 'Permissions fetched successfully' })
    @Get()
    findAll() {
        return this.permissionsService.findAll();
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @ApiOperation({ summary: 'List active permissions' })
    @ApiOkResponse({ description: 'Active permissions fetched successfully' })
    @Get('active')
    findActive() {
        return this.permissionsService.findActive();
    }

    @Permissions(PermissionKey.PERMISSIONS_READ)
    @ApiOperation({ summary: 'Get permission by ID' })
    @ApiOkResponse({ description: 'Permission fetched successfully' })
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.permissionsService.findOne(id);
    }
}