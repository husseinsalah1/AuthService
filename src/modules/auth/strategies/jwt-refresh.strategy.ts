import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

function refreshTokenFromRequest(req: Request): string | null {
    const fromBody = req.body?.refreshToken;
    if (typeof fromBody === 'string' && fromBody.trim().length > 0) {
        return fromBody.trim();
    }
    const authHeader = req.headers?.authorization;
    if (
        typeof authHeader === 'string' &&
        authHeader.startsWith('Bearer ')
    ) {
        const token = authHeader.slice(7).trim();
        return token.length > 0 ? token : null;
    }
    return null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => refreshTokenFromRequest(req),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('jwt.refreshSecret'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload) {
        const refreshToken = refreshTokenFromRequest(req);
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }
        return {
            ...payload,
            id: payload.sub,
            refreshToken,
        };
    }
}