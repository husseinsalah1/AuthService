import { DataSource } from 'typeorm';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { Role } from '@/modules/roles/entities/role.entity';
import { PermissionKey } from '@/modules/permissions/enums';

type RoleSeed = {
  key: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPLIER' | 'USER';
  name: string;
  description: string;
  isActive: boolean;
  permissions: PermissionKey[];
};

/**
 * Role catalog:
 * - key: stable system identifier used in code/mapping
 * - name: human-readable permission bundle label
 * - permissions: exact granted capabilities
 */
const ROLE_SEEDS: RoleSeed[] = [
  {
    key: 'SUPER_ADMIN',
    name: 'Full Access',
    description: 'Full system access with all permissions',
    isActive: true,
    permissions: Object.values(PermissionKey),
  },
  {
    key: 'ADMIN',
    name: 'Admin Access',
    description: 'Administrative access bundle',
    isActive: true,
    permissions: [
      PermissionKey.USERS_LIST,
      PermissionKey.USERS_CREATE,
      PermissionKey.USERS_READ,
      PermissionKey.USERS_UPDATE,
      PermissionKey.USERS_DELETE,
      PermissionKey.ADMINS_CREATE,
      PermissionKey.ADMINS_READ,
      PermissionKey.ADMINS_UPDATE,
      PermissionKey.ADMINS_DELETE,
      PermissionKey.ROLES_CREATE,
      PermissionKey.ROLES_READ,
      PermissionKey.ROLES_UPDATE,
      PermissionKey.ROLES_DELETE,
      PermissionKey.PERMISSIONS_READ,
    ],
  },
  {
    key: 'SUPPLIER',
    name: 'Supplier Access',
    description: 'Supplier access bundle',
    isActive: true,
    permissions: [PermissionKey.USERS_READ, PermissionKey.USERS_UPDATE],
  },
  {
    key: 'USER',
    name: 'Basic Access',
    description: 'Basic end-user permissions',
    isActive: true,
    permissions: [PermissionKey.USERS_READ, PermissionKey.USERS_UPDATE],
  },
];

export async function seederRole(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // 1) Upsert role definitions by key (restore if soft-deleted).
  for (const role of ROLE_SEEDS) {
    const existingRole = await roleRepository.findOne({
      where: { key: role.key },
      withDeleted: true,
    });

    if (existingRole) {
      if (existingRole.deletedAt) {
        await roleRepository.restore(existingRole.id);
      }

      await roleRepository.update(existingRole.id, {
        name: role.name,
        description: role.description,
        isActive: role.isActive,
      });

      continue;
    }

    const newRole = roleRepository.create({
      key: role.key,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
    });

    await roleRepository.save(newRole);
  }

  // 2) Assign exact permission sets for each role.
  for (const roleSeed of ROLE_SEEDS) {
    const role = await roleRepository.findOne({
      where: { key: roleSeed.key },
      relations: { permissions: true },
    });

    if (!role) {
      continue;
    }

    const permissions = await permissionRepository.find({
      where: roleSeed.permissions.map((key) => ({ key, isActive: true })),
    });

    role.permissions = permissions;
    await roleRepository.save(role);
  }
}
