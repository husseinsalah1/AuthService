import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '@/modules/auth/auth.service';
import { CurrentUser, Public } from '@/shared/decorators';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '@/modules/auth/dtos';
import { RequestWithUser } from '@/shared/interfaces';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';
import { User } from '@/modules/users/entities/user.entity';
import { SendOtpDto } from '@/modules/auth/dtos/send-otp.dto';
import { VerifyOtpDto } from '@/modules/auth/dtos/verify-otp.dto';
import { UserMapper } from '@/modules/users/mappers/user.mapper';
import { AuthRequestMapper } from '@/modules/auth/mappers/auth-request.mapper';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(AuthRequestMapper.toRegisterCommand(dto));
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(AuthRequestMapper.toLoginCommand(dto));
    }

    @Public()
    @UseGuards(AuthGuard('jwt-refresh'))
    @Post('refresh')
    refresh(@Req() req: RequestWithUser) {
        return this.authService.refresh(req.user.id, req.user.refreshToken, req.user.jti);
    }

    @Public()
    @Throttle({ default: { limit: 3, ttl: 60_000 } })
    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(AuthRequestMapper.toForgotPasswordCommand(dto));
    }

    @Public()
    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(AuthRequestMapper.toResetPasswordCommand(dto));
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: User) {
        return UserMapper.toResponse(user)
    }

    @Public()
    @Throttle({ default: { limit: 3, ttl: 60_000 } })
    @Post('/send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(AuthRequestMapper.toSendOtpCommand(dto))
    }

    @Public()
    @Post('/verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(AuthRequestMapper.toVerifyOtpCommand(dto))
    }
}