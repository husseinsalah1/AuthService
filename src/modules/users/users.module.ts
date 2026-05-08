import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';
import { PasswordModule } from '@/modules/password/password.module';
import { RolesModule } from '@/modules/roles/roles.module';
import { USER_REPOSITORY } from '@/modules/users/domain/repositories/user.repository.port';
import { TypeormUserRepository } from '@/modules/users/infrastructure/repositories/typeorm-user.repository';

@Module({
    imports: [TypeOrmModule.forFeature([User]), PasswordModule, RolesModule],
    providers: [
        UsersService,
        TypeormUserRepository,
        {
            provide: USER_REPOSITORY,
            useExisting: TypeormUserRepository,
        },
    ],
    controllers: [UsersController],
    exports: [UsersService],             // export so AuthModule can use it
})
export class UsersModule { }