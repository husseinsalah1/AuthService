import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSuperAdminRole1710000000000 implements MigrationInterface {
  name = 'SeedSuperAdminRole1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO roles (id, name, description, "createdAt", "updatedAt")
      VALUES (
        uuid_generate_v4(),
        'Super Admin',
        'Full system access with all permissions',
        NOW(),
        NOW()
      )
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM roles
      WHERE name = 'Super Admin';
    `);
  }
}