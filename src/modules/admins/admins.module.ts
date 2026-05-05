import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { UsersModule } from '../users/users.module';
import { AdminsService } from './admins.service';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [UsersModule, RolesModule],
  controllers: [AdminsController],
  providers: [AdminsService]
})
export class AdminsModule {}
