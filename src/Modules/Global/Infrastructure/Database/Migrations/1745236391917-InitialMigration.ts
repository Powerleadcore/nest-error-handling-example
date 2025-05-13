import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1745236391917 implements MigrationInterface {
    name = 'InitialMigration1745236391917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'PENDING', 'BLOCK')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT', 'SELLER')`);
        await queryRunner.query(`CREATE TYPE "public"."currencies_enum" AS ENUM('USD', 'CAD', 'EUR', 'AED', 'AFN', 'ALL', 'AMD', 'ARS', 'AUD', 'AZN', 'BAM', 'BDT', 'BGN', 'BHD', 'BIF', 'BND', 'BOB', 'BRL', 'BWP', 'BYN', 'BZD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'GBP', 'GEL', 'GHS', 'GNF', 'GTQ', 'HKD', 'HNL', 'HRK', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KHR', 'KMF', 'KRW', 'KWD', 'KZT', 'LBP', 'LKR', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MOP', 'MUR', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SDG', 'SEK', 'SGD', 'SOS', 'SYP', 'THB', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'UYU', 'UZS', 'VEF', 'VND', 'XAF', 'XOF', 'YER', 'ZAR', 'ZMK', 'ZWL')`);
        await queryRunner.query(`CREATE TABLE "users_table" ("user_id" uuid NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "status" "public"."users_status_enum" NOT NULL, "role" "public"."users_role_enum" NOT NULL, "rank" numeric NOT NULL, "currency" "public"."currencies_enum" NOT NULL DEFAULT 'USD', "email_verification" jsonb, "password_reset" jsonb, "user_settings" jsonb NOT NULL, "create_at" TIMESTAMP WITH TIME ZONE NOT NULL, "update_at" TIMESTAMP WITH TIME ZONE, "delete_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_985c2713c9d45effee4565c60e7" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USERS_EMAIL" ON "users_table" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_STATUS" ON "users_table" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_DELETE_AT" ON "users_table" ("delete_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_CREATE_AT" ON "users_table" ("create_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_STATUS_DELETE_AT" ON "users_table" ("status", "delete_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_USERS_RANK" ON "users_table" ("rank") `);
        await queryRunner.query(`CREATE TABLE "profiles_table" ("profile_id" uuid NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "phone_number" character varying NOT NULL, "create_at" TIMESTAMP WITH TIME ZONE NOT NULL, "update_at" TIMESTAMP WITH TIME ZONE, "delete_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, CONSTRAINT "REL_c53ab61bfec4d9242825b93269" UNIQUE ("user_id"), CONSTRAINT "PK_249acfa0d628628f4e0a4a9d75c" PRIMARY KEY ("profile_id"))`);
        await queryRunner.query(`ALTER TABLE "profiles_table" ADD CONSTRAINT "FK_USER_PROFILE" FOREIGN KEY ("user_id") REFERENCES "users_table"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles_table" DROP CONSTRAINT "FK_USER_PROFILE"`);
        await queryRunner.query(`DROP TABLE "profiles_table"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_RANK"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_STATUS_DELETE_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_CREATE_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_DELETE_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERS_EMAIL"`);
        await queryRunner.query(`DROP TABLE "users_table"`);
        await queryRunner.query(`DROP TYPE "public"."currencies_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    }

}
