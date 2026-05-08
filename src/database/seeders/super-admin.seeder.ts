import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Role } from '@/modules/roles/entities/role.entity';
import { User } from '@/modules/users/entities/user.entity';
import { UserStatus, UserType } from '@/modules/users/enums';

const SUPER_ADMIN_ROLE_KEY = 'SUPER_ADMIN';
const DEFAULT_SUPER_ADMIN_FIRST_NAME = 'Hussein';
const DEFAULT_SUPER_ADMIN_LAST_NAME = 'Salah';
const DEFAULT_SUPER_ADMIN_PHONE = '+201000000001';
const DEFAULT_SUPER_ADMIN_COUNTRY_CODE = 'EG';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for super admin seeding`);
  }
  return value;
}

export async function seedSuperAdminCredentials(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  const superAdminRole = await roleRepository.findOne({
    where: { key: SUPER_ADMIN_ROLE_KEY },
  });

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found. Run role seeder first.');
  }

  const email = getRequiredEnv('SUPER_ADMIN_EMAIL');
  const password = getRequiredEnv('SUPER_ADMIN_PASSWORD');
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME ?? DEFAULT_SUPER_ADMIN_FIRST_NAME;
  const lastName = process.env.SUPER_ADMIN_LAST_NAME ?? DEFAULT_SUPER_ADMIN_LAST_NAME;
  const phoneNumber = process.env.SUPER_ADMIN_PHONE ?? DEFAULT_SUPER_ADMIN_PHONE;
  const countryCode = process.env.SUPER_ADMIN_COUNTRY_CODE ?? DEFAULT_SUPER_ADMIN_COUNTRY_CODE;

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await userRepository.findOne({
    where: [{ email }, { phoneNumber }],
    withDeleted: true,
  });

  if (existing) {
    if (existing.deletedAt) {
      await userRepository.restore(existing.id);
    }

    await userRepository.update(existing.id, {
      firstName,
      lastName,
      email,
      phoneNumber,
      countryCode,
      password: hashedPassword,
      roleId: superAdminRole.id,
      userType: UserType.SUPERADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    console.log(`Super admin user updated: ${email}`);
    return;
  }

  const user = userRepository.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phoneNumber,
    countryCode,
    roleId: superAdminRole.id,
    userType: UserType.SUPERADMIN,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isPhoneVerified: true,
  });

  await userRepository.save(user);
  console.log(`Super admin user created: ${email}`);
}
