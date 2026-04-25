import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dtos/create-permission.dto';

@Injectable()
export class PermissionsService {
    constructor(
        @InjectRepository(Permission)
        private readonly permissionsRepository: Repository<Permission>,
    ) { }

    async create(dto: CreatePermissionDto): Promise<Permission> {
        const existingPermission = await this.permissionsRepository.findOne({
            where: [{ name: dto.name }, { key: dto.key }],
        });

        if (existingPermission) {
            throw new ConflictException('Permission already exists');
        }

        const permission = this.permissionsRepository.create({
            ...dto,
            key: dto.key.toLowerCase(),
        });

        return this.permissionsRepository.save(permission);
    }

    async findAll(): Promise<Permission[]> {
        return this.permissionsRepository.find({
            order: {
                group: 'ASC',
                key: 'ASC',
            },
        });
    }

    async findActive(): Promise<Permission[]> {
        return this.permissionsRepository.find({
            where: {
                isActive: true,
            },
            order: {
                group: 'ASC',
                key: 'ASC',
            },
        });
    }

    async findByIds(ids: string[]): Promise<Permission[]> {
        return this.permissionsRepository.find({
            where: {
                id: In(ids),
                isActive: true,
            },
        });
    }

    async findByKeys(keys: string[]): Promise<Permission[]> {
        return this.permissionsRepository.find({
            where: {
                key: In(keys),
                isActive: true,
            },
        });
    }

    async findOne(id: string): Promise<Permission> {
        const permission = await this.permissionsRepository.findOne({
            where: { id },
        });

        if (!permission) {
            throw new NotFoundException('Permission not found');
        }

        return permission;
    }
}