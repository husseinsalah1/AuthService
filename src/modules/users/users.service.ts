import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AppLogger } from "../../shared/logger";
import { User } from "./entities/user.entity";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateUserDto, UpdateUserDto } from "./dtos";
import { UserStatus, UserType } from "./enums";
import { PasswordService } from "../password/password.service";
import { RolesService } from "../roles/roles.service";
import { CreateUserCommand } from "./commands/create-user.command";
import { UserMapper } from "./mappers/user.mapper";

@Injectable()
export class UsersService {
    private readonly logger = new AppLogger(UsersService.name)

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly passwordService: PasswordService,
        private readonly rolesService: RolesService

    ) { }

    private mapRoleKeyToUserType(roleKey?: string): UserType {
        switch (roleKey) {
            case UserType.SUPPLIER:
                return UserType.SUPPLIER;
            case UserType.ADMIN:
                return UserType.ADMIN;
            case UserType.SUPERADMIN:
                return UserType.SUPERADMIN;
            default:
                return UserType.USER;
        }
    }


    async create(command: CreateUserCommand) {
        const { email, phoneNumber } = command
        if (email) {
            const exists = await this.findByEmail(email)
            if (exists) throw new ConflictException("Email already in use")
        }

        if (phoneNumber) {
            const exists = await this.findByPhone(phoneNumber)
            if (exists) throw new ConflictException("Phone number already in use")
        }

        command.password = await this.passwordService.hash(command.password)
        let roleKey = UserType.USER;
        if (!command.roleId) {
            const role = await this.rolesService.findByKey(UserType.USER);
            command.roleId = role.id;
            roleKey = role.key as UserType;
        } else {
            const role = await this.rolesService.findOne(command.roleId);
            roleKey = role.key as UserType;
        }
        command.userType = command.userType ?? this.mapRoleKeyToUserType(roleKey);
        const user = this.userRepo.create(command)
        const saved = await this.userRepo.save(user)

        this.logger.log(`User Created → ${saved.id} with role ${saved.role?.name}`)
        return saved
    }

    async findByEmail(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        return user
    }

    async findByPhone(phoneNumber: string) {
        const user = await this.userRepo.findOne({ where: { phoneNumber } });
        return user
    }

    // ─── Read ─────────────────────────────────────────────
    async findById(id: string) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: {
                role: true,
            }
        });

        if (!user) throw new NotFoundException(`User ${id} not found`);
        return UserMapper.toResponse(user)

    }

    async findAuthUserById(id: string) {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: {
                role: {
                    permissions: true,
                },
            },
        });

        if (!user) throw new NotFoundException(`User ${id} not found`);
        return user;
    }

    async findWithPasswordByIdentifier(where: FindOptionsWhere<User>) {
        const user = await this.userRepo.findOne({
            where,
            relations: {
                role: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                countryCode: true,
                password: true,
                role: true,
                userType: true,
                status: true,
                isPhoneVerified: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return null;
        }

        return user
    }

    async findByIdentifier(where: FindOptionsWhere<User>) {
        return this.userRepo.findOne({
            where,
        });
    }

    // ─── Update ───────────────────────────────────────────
    async update(id: string, dto: UpdateUserDto) {
        const user = await this.findById(id);
        Object.assign(user, dto);
        const updated = await this.userRepo.save(user);
        this.logger.log(`User updated → ${id}`);
        return updated;
    }

    // ─── Status helpers ───────────────────────────────────
    async activate(id: string) {
        return this.update(id, { status: UserStatus.ACTIVE });
    }

    async ban(id: string) {
        this.logger.warn(`User banned → ${id}`);
        return this.update(id, { status: UserStatus.BANNED });
    }

    async deactivate(id: string) {
        return this.update(id, { status: UserStatus.INACTIVE });
    }

    async softDelete(id: string): Promise<void> {
        await this.findById(id);
        await this.userRepo.softDelete(id);
        this.logger.warn(`User soft deleted → ${id}`);
    }

}