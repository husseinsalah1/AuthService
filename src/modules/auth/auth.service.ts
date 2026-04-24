import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AppLogger } from "src/shared/logger";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterDto } from "./dtos";
import { AuthResponse, AuthTokens } from "./interfaces";
import { UserRole, UserStatus } from "../users/enums";
import { TokensService } from "../tokens/tokens.service";
import * as crypto from 'crypto';
import { OtpService } from "../otp/otp.service";
import { PasswordService } from "../password/password.service"
import { CreateUserCommand } from "../users/commands/create-user.command";
import { normalizePhoneNumber } from "src/shared/utils/phone-number.util";
import { LoginUserCommand } from "./commands/login.command";
import { parseLoginIdentifier } from "src/shared/utils/login-identifier.util";
import { IdentifierType } from "./enums/identifier-type.enum";
import { ForgotPasswordUserCommand } from "./commands/forgot-password.command";
import { SendOtpCommand } from "./commands/send-otp.command";
import { VerifyOtpCommand } from "./commands/verify-otp";
import { ResetPasswordCommand } from "./commands/reset-password.command";

@Injectable()
export class AuthService {
    private readonly logger = new AppLogger(AuthService.name)
    constructor(
        private readonly usersService: UsersService,
        private readonly tokensService: TokensService,
        private readonly otpService: OtpService,
        private readonly passwordService: PasswordService
    ) { }

    // ====== Register ======
    async register(command: CreateUserCommand) {
        const { phoneNumber, countryCode } = command
        const normalizedPhone = normalizePhoneNumber(phoneNumber, countryCode)

        command.status = UserStatus.PENDING_VERIFICATION
        command.role = UserRole.USER
        command.phoneNumber = normalizedPhone.phoneNumber
        command.countryCode = normalizedPhone.countryCode

        const user = await this.usersService.create(command);

        this.logger.log(`New user registered → ${user.id}`);
        const tokens = await this.tokensService.generateTokens(user);
        return {
            data: {
                ...user,
            },
            meta: {
                tokens
            }
        };
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
            throw new UnauthorizedException('Phone number is not verified');
        }

        delete user.password

        this.logger.log(`User logged in → ${user.id}`);
        const tokens = await this.tokensService.generateTokens(user);
        return {
            data: {
                ...user,
                tokens
            },
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

        const resetLink = `${process.env.APP_FRONTEND_URL}/reset-password?token=${token}`;

        // await this.usersService.update(user.id, {
        //     passwordResetToken: token,
        //     passwordResetExpiresAt: expires,
        // });

        // TODO: send email with reset link containing token
        this.logger.log(`Password reset requested → ${user.id}`);

        return {
            // Only return token in development
            ...(process.env.NODE_ENV === 'development' && {
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
            password: await this.passwordService.hash(newPassword),
        });

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
        return this.otpService.sendOtp(identifier, identifierType)
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

        await this.usersService.update(exists.id, {
            isPhoneVerified: true,
            status: UserStatus.ACTIVE
        })

        return this.otpService.verifyOtp(identifier, code)
    }

    // ─── Refresh ──────────────────────────────────────────
    async refresh(userId: string): Promise<AuthTokens> {
        const user = await this.usersService.findById(userId);
        if (!user) throw new UnauthorizedException('User not found');

        this.logger.log(`Tokens refreshed → ${user.id}`);
        return this.tokensService.generateTokens(user);
    }
}