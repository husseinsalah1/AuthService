import { Request } from 'express';
import { User } from '@/modules/users/entities/user.entity';

export interface RequestUser extends User {
    refreshToken?: string;
    jti?: string;
}

export interface RequestWithUser extends Request {
    user: RequestUser;
}