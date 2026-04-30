import { DataSource } from 'typeorm';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { Role } from 'src/modules/roles/entities/role.entity';

const SUPER_ADMIN_ROLE = {
  name: 'Super Admin',
  key: 'SUPER_ADMIN',
  description: 'Full system access with all permissions',
  isActive: true,
};

const USER_ROLE = {
  name: 'User',
  key: 'USER',
  description: 'Basic user role',
  isActive: true,
};

const ADMIN_ROLE = {
  name: 'Admin',
  key: 'ADMIN',
  description: 'Admin role',
  isActive: true,
};

const SUPPLIER_ROLE = {
  name: 'Supplier',
  key: 'SUPPLIER',
  description: 'Supplier role',
  isActive: true,
};

const roles = [
  SUPER_ADMIN_ROLE,
  USER_ROLE,
  ADMIN_ROLE,
  SUPPLIER_ROLE,
];

export async function seederRole(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(Role);

  for (const role of roles) {
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
      });

      continue;
    }

    const newRole = roleRepository.create(role);

    await roleRepository.save(newRole);
  }
}
