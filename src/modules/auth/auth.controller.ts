import { Controller, Post, Body, UseGuards, Req, Get, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from '../../shared/decorators';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dtos';
import { RequestWithUser } from '../../shared/interfaces';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { IsString, Length } from 'class-validator';
import { SendOtpDto } from './dtos/send-otp.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @UseGuards(AuthGuard('jwt-refresh'))
    @Post('refresh')
    refresh(@Req() req: RequestWithUser) {
        return this.authService.refresh(req.user.id);
    }

    @Public()
    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@CurrentUser() user: User) {
        return user
    }

    @Public()
    @Post('/send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto)
    }

    @Public()
    @Post('/verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto)
    }
}