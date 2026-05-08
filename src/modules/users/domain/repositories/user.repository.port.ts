import { FindOptionsWhere } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { ListUsersQuery } from '@/modules/users/queries/list-users.query';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
    findAll(query: ListUsersQuery): Promise<{ users: User[]; total: number }>;
    findByIdWithRole(id: string): Promise<User | null>;
    findAuthUserById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phoneNumber: string): Promise<User | null>;
    findByIdentifier(where: FindOptionsWhere<User>): Promise<User | null>;
    findWithPasswordByIdentifier(where: FindOptionsWhere<User>): Promise<User | null>;
    create(data: Partial<User>): User;
    save(user: User): Promise<User>;
    softDelete(id: string): Promise<void>;
}
