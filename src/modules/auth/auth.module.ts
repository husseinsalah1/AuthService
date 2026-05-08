import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '@/modules/auth/strategies/jwt-refresh.strategy';
import { UsersModule } from '@/modules/users/users.module';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { OtpModule } from '@/modules/otp/otp.module';
import { PasswordModule } from '@/modules/password/password.module';
import { RolesModule } from '@/modules/roles/roles.module';

@Module({
    imports: [
        UsersModule,
        TokensModule,
        OtpModule,
        PasswordModule,
        RolesModule
    ],
    providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }