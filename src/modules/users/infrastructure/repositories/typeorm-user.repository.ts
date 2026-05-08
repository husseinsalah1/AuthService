import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.port';
import { User } from '@/modules/users/entities/user.entity';
import { ListUsersQuery } from '@/modules/users/queries/list-users.query';

@Injectable()
export class TypeormUserRepository implements IUserRepository {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async findAll(query: ListUsersQuery): Promise<{ users: User[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            userType,
            roleId,
            isPhoneVerified,
            isEmailVerified,
        } = query;

        const qb = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.role', 'role')
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (search?.trim()) {
            qb.andWhere(
                `(LOWER(user.firstName) LIKE LOWER(:search)
                OR LOWER(user.lastName) LIKE LOWER(:search)
                OR LOWER(user.email) LIKE LOWER(:search)
                OR user.phoneNumber LIKE :search)`,
                { search: `%${search.trim()}%` },
            );
        }

        if (status) {
            qb.andWhere('user.status = :status', { status });
        }

        if (userType) {
            qb.andWhere('user.userType = :userType', { userType });
        }

        if (roleId) {
            qb.andWhere('user.roleId = :roleId', { roleId });
        }

        if (typeof isPhoneVerified === 'boolean') {
            qb.andWhere('user.isPhoneVerified = :isPhoneVerified', { isPhoneVerified });
        }

        if (typeof isEmailVerified === 'boolean') {
            qb.andWhere('user.isEmailVerified = :isEmailVerified', { isEmailVerified });
        }

        const [users, total] = await qb.getManyAndCount();
        return { users, total };
    }

    findByIdWithRole(id: string): Promise<User | null> {
        return this.userRepo.findOne({
            where: { id },
            relations: { role: true },
        });
    }

    findAuthUserById(id: string): Promise<User | null> {
        return this.userRepo.findOne({
            where: { id },
            relations: { role: { permissions: true } },
        });
    }

    findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    findByPhone(phoneNumber: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { phoneNumber } });
    }

    findByIdentifier(where: FindOptionsWhere<User>): Promise<User | null> {
        return this.userRepo.findOne({ where });
    }

    findWithPasswordByIdentifier(where: FindOptionsWhere<User>): Promise<User | null> {
        return this.userRepo.findOne({
            where,
            relations: { role: true },
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
    }

    create(data: Partial<User>): User {
        return this.userRepo.create(data);
    }

    save(user: User): Promise<User> {
        return this.userRepo.save(user);
    }

    async softDelete(id: string): Promise<void> {
        await this.userRepo.softDelete(id);
    }
}
