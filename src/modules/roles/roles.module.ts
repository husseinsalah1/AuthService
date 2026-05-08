import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { RolesController } from '@/modules/roles/roles.controller';
import { RolesService } from '@/modules/roles/roles.service';
import { PermissionsModule } from '@/modules/permissions/permissions.module';


@Module({
    imports: [TypeOrmModule.forFeature([Role]), PermissionsModule],
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule { }