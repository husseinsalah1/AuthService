import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { UserStatus } from '../enums/user-status.enum';
import { Role } from 'src/modules/roles/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', nullable: true, length: 100 })
    firstName: string;

    @Column({ type: 'varchar', nullable: true, length: 100 })
    lastName: string;

    @Index()
    @Column({ type: 'varchar', unique: true, nullable: true, length: 255 })
    email: string;

    @Column({ type: 'varchar', nullable: true, select: false })
    password: string;

    @Index()
    @Column({ type: 'varchar', unique: true, nullable: true, length: 20 })
    phoneNumber: string;

    @Column({ type: 'varchar', nullable: true, length: 10 })
    countryCode: string;

    @Column({ type: 'boolean', default: false })
    isPhoneVerified: boolean;

    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;

    @Column({ type: 'uuid', nullable: true })
    roleId: string;

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
    status: UserStatus;

    @Column({ type: 'timestamptz', nullable: true })
    lastLoginAt: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamptz' })
    deletedAt: Date;

}