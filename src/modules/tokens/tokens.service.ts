import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { User } from '@/modules/users/entities/user.entity';
import { JwtPayload } from '@/shared/interfaces';
import { AuthTokens } from '@/modules/auth/interfaces';
import { UserResponse } from '@/modules/users/types/user-response.type';
import { randomUUID } from 'crypto';

@Injectable()
export class TokensService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async generateTokens(user: User): Promise<AuthTokens> {
        const jti = randomUUID();
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            countryCode: user.countryCode,
            role: user?.role?.key || "",
            jti,
        };

        const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') as StringValue;
        const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') as StringValue;

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.accessSecret'),
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('jwt.refreshSecret'),
                expiresIn: refreshExpiresIn,
            }),
        ]);

        return { accessToken, refreshToken };
    }
}
