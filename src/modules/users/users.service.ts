import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@/shared/logger";
import { User } from "@/modules/users/entities/user.entity";
import { FindOptionsWhere } from "typeorm";
import { UserStatus, UserType } from "@/modules/users/enums";
import { PasswordService } from "@/modules/password/password.service";
import { RolesService } from "@/modules/roles/roles.service";
import { CreateUserCommand } from "@/modules/users/commands/create-user.command";
import { UpdateUserCommand } from "@/modules/users/commands/update-user.command";
import { UserMapper } from "@/modules/users/mappers/user.mapper";
import { IUserRepository, USER_REPOSITORY } from "@/modules/users/domain/repositories/user.repository.port";
import { ListUsersQuery } from "@/modules/users/queries/list-users.query";

@Injectable()
export class UsersService {
    private readonly logger = new AppLogger(UsersService.name)

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepo: IUserRepository,
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

    private async findEntityById(id: string): Promise<User> {
        const user = await this.userRepo.findByIdWithRole(id);
        if (!user) throw new NotFoundException(`User ${id} not found`);
        return user;
    }

    async findAll(query: ListUsersQuery = {}) {
        const {
            page = 1,
            limit = 10,
        } = query;

        const { users, total } = await this.userRepo.findAll(query);
        const pageCount = users.length;
        const totalPages = Math.ceil(total / limit);

        return {
            data: users.map((user) => UserMapper.toResponse(user)),
            message: 'Users fetched successfully',
            meta: {
                total,
                page,
                limit,
                pageCount,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
        };
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

        let roleKey = command.userType ?? UserType.USER;

        command.password = await this.passwordService.hash(command.password)
        command.userType = this.mapRoleKeyToUserType(roleKey);

        if (!command.roleId) {
            const role = await this.rolesService.findByKey(roleKey);
            command.roleId = role.id;
            roleKey = role.key as UserType;
        } else {
            const role = await this.rolesService.findOne(command.roleId);
            roleKey = role.key as UserType;
        }
        const user = this.userRepo.create(command)
        const saved = await this.userRepo.save(user)

        this.logger.log(`User Created → ${saved.id} with role ${saved.role?.name}`)
        return saved
    }

    async findByEmail(email: string) {
        const user = await this.userRepo.findByEmail(email);
        return user
    }

    async findByPhone(phoneNumber: string) {
        const user = await this.userRepo.findByPhone(phoneNumber);
        return user
    }

    // ─── Read ─────────────────────────────────────────────
    async findById(id: string) {
        const user = await this.findEntityById(id);
        return UserMapper.toResponse(user)

    }

    async findAuthUserById(id: string): Promise<User | null> {
        return this.userRepo.findAuthUserById(id);
    }

    async findWithPasswordByIdentifier(where: FindOptionsWhere<User>) {
        const user = await this.userRepo.findWithPasswordByIdentifier(where);

        if (!user) {
            return null;
        }

        return user
    }

    async findByIdentifier(where: FindOptionsWhere<User>) {
        return this.userRepo.findByIdentifier(where);
    }

    // ─── Update ───────────────────────────────────────────
    async update(id: string, command: UpdateUserCommand) {
        const user = await this.findEntityById(id);
        const updateData = { ...command };

        if (typeof updateData.password === 'string' && updateData.password.trim().length > 0) {
            updateData.password = await this.passwordService.hash(updateData.password);
        }

        Object.assign(user, updateData);
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
        await this.findEntityById(id);
        await this.userRepo.softDelete(id);
        this.logger.warn(`User soft deleted → ${id}`);
    }

}