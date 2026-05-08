import { Module } from '@nestjs/common';
import { OtpService } from '@/modules/otp/otp.service';

@Module({
    controllers: [],
    providers: [OtpService],
    exports: [OtpService]
})
export class OtpModule { }