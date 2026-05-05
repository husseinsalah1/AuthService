import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dtos';
import { PermissionsService } from '../permissions/permissions.service';
import { Meta } from 'src/shared/interceptors/transform.interceptor';


@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
        private readonly permissionsService: PermissionsService
    ) { }
    generateRoleKey(name: string): string {
        return name
            .trim()
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .replace(/[^A-Za-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .toUpperCase();
    }

    async create(dto: CreateRoleDto): Promise<Role> {
        const key = this.generateRoleKey(dto.name);

        await this.ensureRoleIsUnique(dto.name, key);

        const role = this.rolesRepository.create({
            ...dto,
            key,
        });

        return this.rolesRepository.save(role);
    }
    
    async findAll(page: number = 1, limit: number = 10){
        const [roles, total] = await this.rolesRepository.findAndCount({
            relations: {
                permissions: true,
            },
            order: {
                createdAt: 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        let formattedRolesResponse = roles.map((role) => {
            return {
                id: role.id,
                name: role.name,
                key: role.key,
                description: role.description,
                isActive: role.isActive,
            };
        });

        return {
            message : 'Roles fetched successfully',
            data: roles,
        };
    }

    async findActive(): Promise<Role[]> {
        return this.rolesRepository.find({
            where: {
                isActive: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findOne(id: string): Promise<Role> {
        const role = await this.rolesRepository.findOne({
            where: { id },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return role;
    }

    async findByKey(key: string): Promise<Role> {
        const role = await this.rolesRepository.findOne({
            where: { key: key.toUpperCase() },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return role;
    }

    async update(id: string, dto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);

        const newName = dto.name ?? role.name;
        const newKey = dto.name ? this.generateRoleKey(dto.name) : role.key;

        await this.ensureRoleIsUnique(newName, newKey, id);

        Object.assign(role, {
            ...dto,
            key: newKey,
        });

        return this.rolesRepository.save(role);
    }

    async remove(id: string): Promise<void> {
        const role = await this.findOne(id);
        await this.rolesRepository.softRemove(role);
    }

    private async ensureRoleIsUnique(
        name: string,
        key: string,
        excludeId?: string,
    ): Promise<void> {
        const existingRole = await this.rolesRepository.findOne({
            where: excludeId
                ? [
                    { name, id: Not(excludeId) },
                    { key, id: Not(excludeId) },
                ]
                : [{ name }, { key }],
        });

        if (existingRole) {
            throw new ConflictException('Role name already exists');
        }
    }

    async findOneWithPermissions(id: string): Promise<any> {
        const role = await this.rolesRepository.findOne({
            where: { id },
            relations: {
                permissions: true,
            },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        const groupedPermissions = role.permissions.reduce(
            (groups, permission) => {
                const group = permission.group || 'others';

                if (!groups[group]) {
                    groups[group] = [];
                }

                groups[group].push({
                    id: permission.id,
                    name: permission.name,
                    key: permission.key,
                    description: permission.description,
                    isActive: permission.isActive,
                });

                return groups;
            },
            {} as Record<string, any[]>,
        );

        return {
            id: role.id,
            name: role.name,
            key: role.key,
            description: role.description,
            isActive: role.isActive,
            permissions: groupedPermissions,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }

    async assignPermissions(
        roleId: string,
        permissionIds: string[],
    ): Promise<Role> {
        const role = await this.rolesRepository.findOne({
            where: { id: roleId },
            relations: {
                permissions: true,
            },
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        const fixedPermissionRoleKeys = new Set(['USER', 'SUPPLIER']);
        if (fixedPermissionRoleKeys.has(role.key)) {
            throw new BadRequestException(
                `Role ${role.key} has fixed permissions and cannot be changed`,
            );
        }

        const permissions = await this.permissionsService.findByIds(permissionIds);

        if (permissions.length !== permissionIds.length) {
            throw new NotFoundException('One or more permissions not found');
        }

        role.permissions = permissions;

        return this.rolesRepository.save(role);
    }
}