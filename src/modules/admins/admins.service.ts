import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { CreateAdminCommand } from '@/modules/admins/commands/create-admin.command';
import { normalizePhoneNumber } from '@/shared/utils/phone-number.util'; 
import { UserStatus, UserType } from '@/modules/users/enums';
import { RolesService } from '@/modules/roles/roles.service';
@Injectable()
export class AdminsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly rolesService: RolesService,
    ) { }

    async createAdmin(command: CreateAdminCommand) {
        const { phoneNumber, countryCode } = command
        if (!command.roleId) {
            throw new BadRequestException('roleId is required to create admin');
        }
        const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode)
        const role = await this.rolesService.findOne(command.roleId);
        command.status = UserStatus.ACTIVE
        command.userType = UserType.ADMIN
        command.roleId = role.id
        command.phoneNumber = normalizedPhone.phoneNumber
        command.countryCode = normalizedPhone.countryCode
        const admin = await this.usersService.create(command)
        return admin
    }
}
