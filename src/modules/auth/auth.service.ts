import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AppLogger } from "@/shared/logger";
import { UsersService } from "@/modules/users/users.service";
import { AuthTokens } from "@/modules/auth/interfaces";
import { UserStatus } from "@/modules/users/enums";
import { UserType } from "@/modules/users/enums/user-type.enum";
import { TokensService } from "@/modules/tokens/tokens.service";
import * as crypto from 'crypto';
import ms from 'ms';
import type { StringValue } from 'ms';
import { OtpService } from "@/modules/otp/otp.service";
import { PasswordService } from "@/modules/password/password.service"
import { CreateUserCommand } from "@/modules/users/commands/create-user.command";
import { normalizePhoneNumber } from "@/shared/utils/phone-number.util";
import { LoginUserCommand } from "@/modules/auth/commands/login.command";
import { parseLoginIdentifier } from "@/shared/utils/login-identifier.util";
import { IdentifierType } from "@/modules/auth/enums/identifier-type.enum";
import { ForgotPasswordUserCommand } from "@/modules/auth/commands/forgot-password.command";
import { SendOtpCommand } from "@/modules/auth/commands/send-otp.command";
import { VerifyOtpCommand } from "@/modules/auth/commands/verify-otp.command";
import { ResetPasswordCommand } from "@/modules/auth/commands/reset-password.command";
import { UserMapper } from "@/modules/users/mappers/user.mapper";
import { RedisService } from "@/modules/redis/redis.service";
import { ConfigService } from "@nestjs/config";
import jwt from 'jsonwebtoken';
import { CountryCode } from "libphonenumber-js";

@Injectable()
export class AuthService {
    private readonly logger = new AppLogger(AuthService.name)
    private readonly refreshSessionPrefix = 'refresh-session';
    private readonly refreshSessionIndexPrefix = 'refresh-session-index';

    constructor(
        private readonly usersService: UsersService,
        private readonly tokensService: TokensService,
        private readonly otpService: OtpService,
        private readonly passwordService: PasswordService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) { }

    private getRefreshSessionKey(userId: string, jti: string): string {
        return `${this.refreshSessionPrefix}:${userId}:${jti}`;
    }

    private getLegacyRefreshSessionKey(userId: string): string {
        return `${this.refreshSessionPrefix}:${userId}`;
    }

    private getRefreshSessionIndexKey(userId: string): string {
        return `${this.refreshSessionIndexPrefix}:${userId}`;
    }

    private hashRefreshToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getRefreshSessionTtlSeconds(): number {
        const configured = (this.configService.get<string>('jwt.refreshExpiresIn') ?? '30d') as StringValue;
        const parsed = ms(configured);
        if (typeof parsed === 'number' && parsed > 0) {
            return Math.ceil(parsed / 1000);
        }
        return 60 * 60 * 24 * 30;
    }

    private extractJtiFromToken(token: string): string | undefined {
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded !== 'object') {
            return undefined;
        }
        const jti = decoded.jti;
        return typeof jti === 'string' && jti.length > 0 ? jti : undefined;
    }

    private async storeRefreshSession(userId: string, refreshToken: string, jti?: string): Promise<void> {
        const tokenHash = this.hashRefreshToken(refreshToken);
        if (!jti) {
            await this.redisService.set(
                this.getLegacyRefreshSessionKey(userId),
                tokenHash,
                this.getRefreshSessionTtlSeconds(),
            );
            return;
        }

        const sessionKey = this.getRefreshSessionKey(userId, jti);
        const indexKey = this.getRefreshSessionIndexKey(userId);
        const currentIndexRaw = await this.redisService.get(indexKey);
        const currentIndex = currentIndexRaw ? JSON.parse(currentIndexRaw) as string[] : [];
        const nextIndex = Array.from(new Set([...currentIndex, jti]));

        await this.redisService.set(
            sessionKey,
            tokenHash,
            this.getRefreshSessionTtlSeconds(),
        );
        await this.redisService.set(
            indexKey,
            JSON.stringify(nextIndex),
            this.getRefreshSessionTtlSeconds(),
        );
    }

    private async revokeRefreshSession(userId: string, jti?: string): Promise<void> {
        if (!jti) {
            await this.redisService.del(this.getLegacyRefreshSessionKey(userId));
            return;
        }

        const sessionKey = this.getRefreshSessionKey(userId, jti);
        const indexKey = this.getRefreshSessionIndexKey(userId);
        const currentIndexRaw = await this.redisService.get(indexKey);
        const currentIndex = currentIndexRaw ? JSON.parse(currentIndexRaw) as string[] : [];
        const nextIndex = currentIndex.filter((item) => item !== jti);

        await this.redisService.del(sessionKey);
        if (nextIndex.length === 0) {
            await this.redisService.del(indexKey);
        } else {
            await this.redisService.set(
                indexKey,
                JSON.stringify(nextIndex),
                this.getRefreshSessionTtlSeconds(),
            );
        }
    }

    private async revokeAllRefreshSessions(userId: string): Promise<void> {
        const indexKey = this.getRefreshSessionIndexKey(userId);
        const currentIndexRaw = await this.redisService.get(indexKey);
        const currentIndex = currentIndexRaw ? JSON.parse(currentIndexRaw) as string[] : [];

        const sessionKeys = currentIndex.map((jti) => this.getRefreshSessionKey(userId, jti));
        if (sessionKeys.length > 0) {
            await this.redisService.del(...sessionKeys);
        }
        await this.redisService.del(indexKey, this.getLegacyRefreshSessionKey(userId));
    }

    // ====== Register ======
    async register(command: CreateUserCommand) {
        const { phoneNumber, countryCode } = command
        const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode)
        // Get Role with user as a default 

        command.status = UserStatus.PENDING_VERIFICATION
        command.userType = UserType.USER
        command.phoneNumber = normalizedPhone.phoneNumber
        command.countryCode = normalizedPhone.countryCode

        const user = await this.usersService.create(command);


        const tokens = await this.tokensService.generateTokens(user);
        await this.storeRefreshSession(user.id, tokens.refreshToken, this.extractJtiFromToken(tokens.refreshToken));

        this.logger.log(`New user registered → ${user.id}`);
        this.sendOtp({
            identifierType: IdentifierType.PHONE_NUMBER,
            identifier: user.phoneNumber,
            countryCode: normalizedPhone.countryCode as CountryCode,
        });
        return {
            ...UserMapper.toResponse(user),
            tokens
        }
    }

    // ====== Login ======
    async login(command: LoginUserCommand) {
        const { password, identifierType } = command
        const parsedIdentifier = parseLoginIdentifier(command);
        const whereCondition = { [identifierType]: parsedIdentifier.value }
        const user = await this.usersService.findWithPasswordByIdentifier(whereCondition);

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await this.passwordService.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        if (user.status === UserStatus.BANNED) {
            throw new UnauthorizedException('Your account has been banned');
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new UnauthorizedException('Your account is inactive');
        }
        if (!user.isPhoneVerified) {
            this.sendOtp({
                identifierType: IdentifierType.PHONE_NUMBER,
                identifier: user.phoneNumber,
                countryCode: user.countryCode as CountryCode,
            });
            throw new UnauthorizedException('Phone number is not verified, OTP sent to your phone number, With 10 minutes to verify');
        }

        const tokens = await this.tokensService.generateTokens(user);
        await this.storeRefreshSession(user.id, tokens.refreshToken, this.extractJtiFromToken(tokens.refreshToken));
        this.logger.log(`User logged in → ${user.id}`);

        return {
            ...UserMapper.toResponse(user),
            tokens
        }
    }

    // ====== Forgot Password ======
    async forgotPassword(command: ForgotPasswordUserCommand) {
        const { identifierType } = command
        const parsedIdentifier = parseLoginIdentifier(command);
        const whereCondition = { [identifierType]: parsedIdentifier.value }
        const user = await this.usersService.findByIdentifier(whereCondition);
        // always return silently to prevent email enumeration
        if (!user) return;

        const token = await this.passwordService.generateResetPasswordSession({
            userId: user.id,
            identifier: parsedIdentifier.value,
        });

        const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL') ?? '';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        // await this.usersService.update(user.id, {
        //     passwordResetToken: token,
        //     passwordResetExpiresAt: expires,
        // });

        // TODO: send email with reset link containing token
        this.logger.log(`Password reset requested → ${user.id}`);

        return {
            // Only return token in development
            ...(this.configService.get<string>('NODE_ENV') === 'development' && {
                token,
                resetLink,
            }),
        };
    }

    // ====== Reset Password ======
    async resetPassword(command: ResetPasswordCommand) {
        const { token, newPassword } = command
        const session = await this.passwordService.consume(token);

        const user = await this.usersService.findById(session.userId);

        await this.usersService.update(user.id, {
            password: newPassword,
        });
        await this.revokeAllRefreshSessions(user.id);

        this.logger.log(`Password reset successful → ${user.id}`);
        return {
            message: "Password reset successfully"
        }
    }

    // ====== Send Otp  ======
    async sendOtp(command: SendOtpCommand) {
        const { identifier, identifierType } = command
        const parsedIdentifier = parseLoginIdentifier(command);
        const whereCondition = { [identifierType]: parsedIdentifier.value }
        const exists = await this.usersService.findByIdentifier(whereCondition);
        if (!exists) {
            throw new NotFoundException("User Not Found");
        }
        this.logger.log(`Sending OTP to ${identifier} for ${identifierType} identifier`);
        return this.otpService.sendOtp(parsedIdentifier.value, parsedIdentifier.type)
    }

    // ====== Verify Otp  ======
    async verifyOtp(command: VerifyOtpCommand) {
        const { identifier, identifierType, countryCode, code } = command
        const parsedIdentifier = parseLoginIdentifier({
            identifierType: identifierType,
            identifier: identifier,
            countryCode: countryCode,
        });
        const exists = await this.usersService.findByIdentifier(
            parsedIdentifier.type === IdentifierType.EMAIL
                ? { email: parsedIdentifier.value }
                : { phoneNumber: parsedIdentifier.value },
        );
        if (!exists) {
            throw new NotFoundException("User Not Found");
        }

        await this.otpService.verifyOtp(parsedIdentifier.value, code)

        await this.usersService.update(
            exists.id,
            parsedIdentifier.type === IdentifierType.EMAIL
                ? {
                    status: UserStatus.ACTIVE,
                    isEmailVerified: true,
                }
                : {
                    status: UserStatus.ACTIVE,
                    isPhoneVerified: true,
                },
        )


        return {
            message: 'OTP verified successfully'
        }
    }

    // ─── Refresh ──────────────────────────────────────────
    async refresh(userId: string, refreshToken?: string, refreshJti?: string): Promise<AuthTokens> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        const user = await this.usersService.findAuthUserById(userId);
        if (!user) throw new UnauthorizedException('User not found');
        if (user.status === UserStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException('User is pending verification');
        }

        const sessionKey = refreshJti
            ? this.getRefreshSessionKey(userId, refreshJti)
            : this.getLegacyRefreshSessionKey(userId);
        const storedHash = await this.redisService.get(sessionKey);
        const incomingHash = this.hashRefreshToken(refreshToken);
        if (!storedHash || storedHash !== incomingHash) {
            throw new UnauthorizedException('Refresh token is invalid or revoked');
        }

        this.logger.log(`Tokens refreshed → ${user.id}`);

        const tokens = await this.tokensService.generateTokens(user);
        if (refreshJti) {
            await this.revokeRefreshSession(user.id, refreshJti);
        } else {
            await this.revokeRefreshSession(user.id);
        }
        await this.storeRefreshSession(user.id, tokens.refreshToken, this.extractJtiFromToken(tokens.refreshToken));

        return tokens
    }
}