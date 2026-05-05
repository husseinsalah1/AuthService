import { Body, Controller, Post } from '@nestjs/common';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { AdminsService } from './admins.service';
import { Permissions } from '../../shared/decorators';
import { PermissionKey } from '../permissions/enums';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }
    @Permissions(PermissionKey.ADMINS_CREATE)
    @Post()
    create(@Body() dto: CreateAdminDto) {
        return this.adminsService.createAdmin(dto)
    }
}
