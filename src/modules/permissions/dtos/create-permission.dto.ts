import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
    @ApiProperty({ example: 'List Users' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @ApiProperty({ example: 'users.list' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    key: string;

    @ApiPropertyOptional({ example: 'users' })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    group?: string;

    @ApiPropertyOptional({ example: 'Can list users' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;

    @ApiPropertyOptional({ example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}