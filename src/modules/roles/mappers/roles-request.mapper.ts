import { CreateRoleDto, UpdateRoleDto } from '@/modules/roles/dtos';
import { CreateRoleCommand } from '@/modules/roles/commands/create-role.command';
import { UpdateRoleCommand } from '@/modules/roles/commands/update-role.command';

export class RolesRequestMapper {
    static toCreateRoleCommand(dto: CreateRoleDto): CreateRoleCommand {
        return {
            name: dto.name,
            description: dto.description,
        };
    }

    static toUpdateRoleCommand(dto: UpdateRoleDto): UpdateRoleCommand {
        return {
            name: dto.name,
            description: dto.description,
        };
    }
}
