import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    key: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    group?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}