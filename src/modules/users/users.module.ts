import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordModule } from '../password/password.module';
import { RolesModule } from '../roles/roles.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), PasswordModule, RolesModule],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],             // export so AuthModule can use it
})
export class UsersModule { }