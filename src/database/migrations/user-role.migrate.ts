import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSuperAdminRole1710000000000 implements MigrationInterface {
  name = 'SeedSuperAdminRole1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, name, key, description, "isActive", "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        'Full Access',
        'SUPER_ADMIN',
        'Full system access with all permissions',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (key) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles
      WHERE key = 'SUPER_ADMIN';
    `);
  }
}