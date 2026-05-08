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
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @ApiOperation({ summary: 'Register a new user account' })
    @ApiBody({ type: RegisterDto })
    @ApiOkResponse({ description: 'User registered successfully with token pair' })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(AuthRequestMapper.toRegisterCommand(dto));
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Authenticate user and issue tokens' })
    @ApiBody({ type: LoginDto })
    @ApiOkResponse({ description: 'Login successful with token pair' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials or user not allowed to login' })
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(AuthRequestMapper.toLoginCommand(dto));
    }

    @Public()
    @UseGuards(AuthGuard('jwt-refresh'))
    @ApiOperation({ summary: 'Refresh access and refresh tokens' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
            },
            required: ['refreshToken'],
        },
    })
    @ApiOkResponse({ description: 'Token pair refreshed successfully' })
    @ApiUnauthorizedResponse({ description: 'Invalid or revoked refresh token' })
    @Post('refresh')
    refresh(@Req() req: RequestWithUser) {
        return this.authService.refresh(req.user.id, req.user.refreshToken, req.user.jti);
    }

    @Public()
    @Throttle({ default: { limit: 3, ttl: 60_000 } })
    @ApiOperation({ summary: 'Request password reset flow' })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiOkResponse({ description: 'Password reset request accepted' })
    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(AuthRequestMapper.toForgotPasswordCommand(dto));
    }

    @Public()
    @ApiOperation({ summary: 'Reset password with valid reset token' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiOkResponse({ description: 'Password reset completed' })
    @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(AuthRequestMapper.toResetPasswordCommand(dto));
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get current authenticated user profile' })
    @ApiOkResponse({ description: 'Authenticated user profile' })
    @ApiUnauthorizedResponse({ description: 'Invalid or expired access token' })
    @Get('me')
    me(@CurrentUser() user: User) {
        return UserMapper.toResponse(user)
    }

    @Public()
    @Throttle({ default: { limit: 3, ttl: 60_000 } })
    @ApiOperation({ summary: 'Send OTP to email or phone' })
    @ApiBody({ type: SendOtpDto })
    @ApiOkResponse({ description: 'OTP sent successfully' })
    @Post('/send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(AuthRequestMapper.toSendOtpCommand(dto))
    }

    @Public()
    @ApiOperation({ summary: 'Verify OTP and activate verification state' })
    @ApiBody({ type: VerifyOtpDto })
    @ApiOkResponse({ description: 'OTP verified successfully' })
    @Post('/verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(AuthRequestMapper.toVerifyOtpCommand(dto))
    }
}