import { DataSource } from 'typeorm';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { PermissionKey } from 'src/modules/permissions/enums';

type PermissionSeed = {
    name: string;
    key: PermissionKey;
    group: string;
    description: string;
};

const permissions: PermissionSeed[] = [
    // Users
    {
        name: 'Create Users',
        key: PermissionKey.USERS_CREATE,
        group: 'users',
        description: 'Can create users',
    },
    {
        name: 'Read Users',
        key: PermissionKey.USERS_READ,
        group: 'users',
        description: 'Can view users',
    },
    {
        name: 'Update Users',
        key: PermissionKey.USERS_UPDATE,
        group: 'users',
        description: 'Can update users',
    },
    {
        name: 'Delete Users',
        key: PermissionKey.USERS_DELETE,
        group: 'users',
        description: 'Can delete users',
    },

    // Roles
    {
        name: 'Create Roles',
        key: PermissionKey.ROLES_CREATE,
        group: 'roles',
        description: 'Can create roles',
    },
    {
        name: 'Read Roles',
        key: PermissionKey.ROLES_READ,
        group: 'roles',
        description: 'Can view roles',
    },
    {
        name: 'Update Roles',
        key: PermissionKey.ROLES_UPDATE,
        group: 'roles',
        description: 'Can update roles',
    },
    {
        name: 'Delete Roles',
        key: PermissionKey.ROLES_DELETE,
        group: 'roles',
        description: 'Can delete roles',
    },

    // Permissions
    {
        name: 'Create Permissions',
        key: PermissionKey.PERMISSIONS_CREATE,
        group: 'permissions',
        description: 'Can create permissions',
    },
    {
        name: 'Read Permissions',
        key: PermissionKey.PERMISSIONS_READ,
        group: 'permissions',
        description: 'Can view permissions',
    },
    {
        name: 'Update Permissions',
        key: PermissionKey.PERMISSIONS_UPDATE,
        group: 'permissions',
        description: 'Can update permissions',
    },
    {
        name: 'Delete Permissions',
        key: PermissionKey.PERMISSIONS_DELETE,
        group: 'permissions',
        description: 'Can delete permissions',
    },
];

export async function seedPermissions(dataSource: DataSource): Promise<void> {
    const permissionRepository = dataSource.getRepository(Permission);

    for (const permissionData of permissions) {
        const existingPermission = await permissionRepository.findOne({
            where: { key: permissionData.key },
            withDeleted: true,
        });

        if (existingPermission) {
            if (existingPermission.deletedAt) {
                await permissionRepository.restore(existingPermission.id);
            }

            await permissionRepository.update(existingPermission.id, {
                name: permissionData.name,
                group: permissionData.group,
                description: permissionData.description,
                isActive: true,
            });

            continue;
        }

        const permission = permissionRepository.create({
            name: permissionData.name,
            key: permissionData.key,
            group: permissionData.group,
            description: permissionData.description,
            isActive: true,
        });

        await permissionRepository.save(permission);
    }

    console.log('Permissions seeded successfully');
}