import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';

@Module({
    controllers: [],
    providers: [OtpService],
    exports: [OtpService]
})
export class OtpModule { }