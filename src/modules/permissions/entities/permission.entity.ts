import { Role } from "src/modules/roles/entities/role.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("permissions")
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'varchar', length: 100, unique: true })
    name: string

    @Index()
    @Column({ type: 'varchar', length: 100, unique: true })
    key: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    group: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @ManyToMany(() => Role, (role) => role.permissions)
    roles: Role[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt?: Date;
}