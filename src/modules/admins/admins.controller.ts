import { Body, Controller, Post } from '@nestjs/common';
import { CreateAdminDto } from '@/modules/admins/dtos/create-admin.dto';
import { AdminsService } from '@/modules/admins/admins.service';
import { Permissions } from '@/shared/decorators';
import { PermissionKey } from '@/modules/permissions/enums';
import { UserMapper } from '@/modules/users/mappers/user.mapper';

@Controller('admins')
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) { }
    @Permissions(PermissionKey.ADMINS_CREATE)
    @Post()
    create(@Body() dto: CreateAdminDto) {
        return this.adminsService
            .createAdmin(dto)
            .then((admin) => UserMapper.toResponse(admin));
    }
}
