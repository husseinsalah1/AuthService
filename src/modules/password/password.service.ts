import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { RedisService } from "../redis/redis.service";
import * as crypto from 'crypto';

interface PasswordResetSession {
    userId: string;
    identifier?: string;
}

@Injectable()
export class PasswordService {
    private readonly saltRounds = 10;
    private readonly prefix = 'password-reset';
    private readonly ttlSeconds = 2 * 60; // 1 hour

    constructor(
        private readonly redisService: RedisService
    ) { }

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds)
    }

    async compare(plain: string, hashed: string) {
        return bcrypt.compare(plain, hashed)
    }

    async generateResetPasswordSession(payload: PasswordResetSession) {
        const token = crypto.randomBytes(32).toString('hex');

        const key = this.getKey(token);

        await this.redisService.set(
            key,
            JSON.stringify(payload),
            this.ttlSeconds,
        );

        return token;
    }


    async verify(token: string): Promise<PasswordResetSession> {
        const key = this.getKey(token);

        const value = await this.redisService.get(key);

        if (!value) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        return JSON.parse(value) as PasswordResetSession;
    }

    async consume(token: string): Promise<PasswordResetSession> {
        const session = await this.verify(token);

        await this.redisService.del(this.getKey(token));

        return session;
    }

    private getKey(token: string): string {
        return `${this.prefix}:${token}`;
    }

}