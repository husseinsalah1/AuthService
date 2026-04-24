import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AppLogger } from "../../shared/logger";
import { User } from "./entities/user.entity";
import { FindOptionsWhere, Repository } from "typeorm";
import { CreateUserDto, UpdateUserDto } from "./dtos";
import { UserStatus } from "./enums";
import { PasswordService } from "../password/password.service";

@Injectable()
export class UsersService {
    private readonly logger = new AppLogger(UsersService.name)

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly passwordService: PasswordService
    ) { }


    async create(command: CreateUserDto): Promise<User> {
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

        const user = this.userRepo.create(command)
        const saved = await this.userRepo.save(user)

        this.logger.log(`User Created → ${saved.id}`)
        return saved
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    async findByPhone(phoneNumber: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { phoneNumber } });
    }

    // ─── Read ─────────────────────────────────────────────
    async findById(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException(`User ${id} not found`);
        return user;
    }

    async findWithPasswordByIdentifier(where: FindOptionsWhere<User>): Promise<User | null> {
        return this.userRepo.findOne({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                countryCode: true,
                password: true,
                role: true,
                status: true,
                isPhoneVerified: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findByIdentifier(where: FindOptionsWhere<User>): Promise<User | null> {
        return this.userRepo.findOne({
            where,
        });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.passwordResetToken')
            .addSelect('user.passwordResetExpiresAt')
            .where('user.passwordResetToken = :token', { token })
            .getOne();
    }

    // ─── Update ───────────────────────────────────────────
    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, dto);
        const updated = await this.userRepo.save(user);
        this.logger.log(`User updated → ${id}`);
        return updated;
    }

    // ─── Status helpers ───────────────────────────────────
    async activate(id: string): Promise<User> {
        return this.update(id, { status: UserStatus.ACTIVE });
    }

    async ban(id: string): Promise<User> {
        this.logger.warn(`User banned → ${id}`);
        return this.update(id, { status: UserStatus.BANNED });
    }

    async deactivate(id: string): Promise<User> {
        return this.update(id, { status: UserStatus.INACTIVE });
    }

    async softDelete(id: string): Promise<void> {
        await this.findById(id);
        await this.userRepo.softDelete(id);
        this.logger.warn(`User soft deleted → ${id}`);
    }

}