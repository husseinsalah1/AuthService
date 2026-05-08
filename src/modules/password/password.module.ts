import { Module } from "@nestjs/common";
import { PasswordService } from "@/modules/password/password.service";
import { RedisModule } from "@/modules/redis/redis.module";

@Module({
    imports: [RedisModule],
    providers: [PasswordService],
    exports: [PasswordService],
})
export class PasswordModule { }