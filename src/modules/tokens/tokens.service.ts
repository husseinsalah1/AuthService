import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from '../../shared/interfaces';
import { AuthTokens } from '../auth/interfaces';

@Injectable()
export class TokensService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async generateTokens(user: User): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
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
