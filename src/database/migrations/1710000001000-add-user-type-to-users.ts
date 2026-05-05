import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypeToUsers1710000001000 implements MigrationInterface {
  name = 'AddUserTypeToUsers1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_usertype_enum" AS ENUM('USER', 'SUPPLIER', 'ADMIN', 'SUPER_ADMIN')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "userType" "public"."users_usertype_enum" NOT NULL DEFAULT 'USER'
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "userType" = CASE r."key"
        WHEN 'SUPPLIER' THEN 'SUPPLIER'::"public"."users_usertype_enum"
        WHEN 'ADMIN' THEN 'ADMIN'::"public"."users_usertype_enum"
        WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"public"."users_usertype_enum"
        ELSE 'USER'::"public"."users_usertype_enum"
      END
      FROM "roles" r
      WHERE u."roleId" = r."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "userType"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."users_usertype_enum"
    `);
  }
}
