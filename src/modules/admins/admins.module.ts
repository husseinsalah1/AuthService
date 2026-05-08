import { Module } from '@nestjs/common';
import { AdminsController } from '@/modules/admins/admins.controller';
import { UsersModule } from '@/modules/users/users.module';
import { AdminsService } from '@/modules/admins/admins.service';
import { RolesModule } from '@/modules/roles/roles.module';

@Module({
  imports: [UsersModule, RolesModule],
  controllers: [AdminsController],
  providers: [AdminsService]
})
export class AdminsModule {}
