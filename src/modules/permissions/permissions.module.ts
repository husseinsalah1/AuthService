import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { PermissionsController } from '@/modules/permissions/permissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule { }