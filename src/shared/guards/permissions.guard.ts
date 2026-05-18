import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionKey } from '@/modules/permissions/enums';
import { PERMISSIONS_KEY } from '@/shared/decorators/permissions.decorator';
import { RequestWithUser } from '@/shared/interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userPermissions = request.user?.role?.permissions ?? [];

    const userPermissionKeys = new Set(userPermissions.map((permission) => permission.key));

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissionKeys.has(permission),
    );

    if (!hasAllRequiredPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissionKeys.has(permission),
      );
      throw new ForbiddenException({
        errors: [
          {
            field: 'permissions',
            message: `Access denied. Missing required permission(s): ${missingPermissions.join(', ')}`,
          },
        ],
      });
    }

    return true;
  }
}
