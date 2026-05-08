import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { PermissionsService } from '@/modules/permissions/permissions.service';
import { CreateRoleCommand } from '@/modules/roles/commands/create-role.command';
import { UpdateRoleCommand } from '@/modules/roles/commands/update-role.command';


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

    async create(command: CreateRoleCommand): Promise<Role> {
        const key = this.generateRoleKey(command.name);

        await this.ensureRoleIsUnique(command.name, key);

        const role = this.rolesRepository.create({
            ...command,
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

        return {
            message : 'Roles fetched successfully',
            data: roles,
            meta: {
                total,
                page,
                limit,
                pageCount: roles.length,
                totalPages: Math.ceil(total / limit),
                hasPreviousPage: page > 1,
                hasNextPage: page * limit < total,
            },
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

    async update(id: string, command: UpdateRoleCommand): Promise<Role> {
        const role = await this.findOne(id);

        const newName = command.name ?? role.name;
        const newKey = command.name ? this.generateRoleKey(command.name) : role.key;

        await this.ensureRoleIsUnique(newName, newKey, id);

        Object.assign(role, {
            ...command,
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
        const normalizedKey = key.toUpperCase();
        const where = excludeId ? { id: Not(excludeId) } : {};

        const existingByName = await this.rolesRepository.findOne({
            where: {
                ...where,
                name,
            },
        });
        if (existingByName) {
            throw new ConflictException('Role name already exists');
        }

        const existingByKey = await this.rolesRepository.findOne({
            where: {
                ...where,
                key: normalizedKey,
            },
        });
        if (existingByKey) {
            throw new ConflictException('Role key already exists');
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