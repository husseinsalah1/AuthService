import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '@/shared/validators/is-strong-password.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ example: '4f1d2f7cf6f6a6c23db1d7210c8f40f2d9dbe8f4ad44f1f71e6e9b6b9ad6af8e' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'Str0ng!NewPass' })
    @IsNotEmpty()
    @IsStrongPassword()
    newPassword: string;
}