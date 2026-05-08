import { CreatePermissionDto } from '@/modules/permissions/dtos/create-permission.dto';
import { CreatePermissionCommand } from '@/modules/permissions/commands/create-permission.command';

export class PermissionsRequestMapper {
    static toCreatePermissionCommand(dto: CreatePermissionDto): CreatePermissionCommand {
        return {
            name: dto.name,
            key: dto.key,
            group: dto.group,
            description: dto.description,
            isActive: dto.isActive,
        };
    }
}
