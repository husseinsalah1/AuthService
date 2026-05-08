import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { JwtPayload } from "jsonwebtoken";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserStatus } from "@/modules/users/enums";
import { UsersService } from "@/modules/users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('jwt.accessSecret')
        })
    }

    async validate(payload: JwtPayload) {
        const user = await this.usersService.findAuthUserById(payload.sub)

        if (!user) {
            throw new UnauthorizedException("User no longer exists")
        }

        if (user.status === UserStatus.BANNED) {
            throw new UnauthorizedException("User is banned")
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new UnauthorizedException('User is inactive');
        }
        if (user.status === UserStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException('User is pending verification');
        }

        return user;

    }
}