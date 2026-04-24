import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @IsOptional()
    passwordResetToken?: string | null;

    @IsOptional()
    passwordResetExpiresAt?: Date | null;

    @IsOptional()
    isPhoneVerified?: boolean
}