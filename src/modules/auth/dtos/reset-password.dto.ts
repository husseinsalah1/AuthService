import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/validators/is-strong-password.validator';

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    @IsStrongPassword()
    newPassword: string;
}