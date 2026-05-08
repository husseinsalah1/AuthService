import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '@/modules/auth/dtos';
import { SendOtpDto } from '@/modules/auth/dtos/send-otp.dto';
import { VerifyOtpDto } from '@/modules/auth/dtos/verify-otp.dto';
import { CreateUserCommand } from '@/modules/users/commands/create-user.command';
import { LoginUserCommand } from '@/modules/auth/commands/login.command';
import { ForgotPasswordUserCommand } from '@/modules/auth/commands/forgot-password.command';
import { ResetPasswordCommand } from '@/modules/auth/commands/reset-password.command';
import { SendOtpCommand } from '@/modules/auth/commands/send-otp.command';
import { VerifyOtpCommand } from '@/modules/auth/commands/verify-otp.command';

export class AuthRequestMapper {
    static toRegisterCommand(dto: RegisterDto): CreateUserCommand {
        return {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            password: dto.password,
            phoneNumber: dto.phoneNumber,
            countryCode: dto.countryCode,
        };
    }

    static toLoginCommand(dto: LoginDto): LoginUserCommand {
        return {
            identifierType: dto.identifierType,
            identifier: dto.identifier,
            password: dto.password,
            countryCode: dto.countryCode,
        };
    }

    static toForgotPasswordCommand(dto: ForgotPasswordDto): ForgotPasswordUserCommand {
        return {
            identifierType: dto.identifierType,
            identifier: dto.identifier,
            countryCode: dto.countryCode,
        };
    }

    static toResetPasswordCommand(dto: ResetPasswordDto): ResetPasswordCommand {
        return {
            token: dto.token,
            newPassword: dto.newPassword,
        };
    }

    static toSendOtpCommand(dto: SendOtpDto): SendOtpCommand {
        return {
            identifierType: dto.identifierType,
            identifier: dto.identifier,
            countryCode: dto.countryCode,
        };
    }

    static toVerifyOtpCommand(dto: VerifyOtpDto): VerifyOtpCommand {
        return {
            identifierType: dto.identifierType,
            identifier: dto.identifier,
            countryCode: dto.countryCode,
            code: dto.code,
        };
    }
}
