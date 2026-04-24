import { Module } from "@nestjs/common";
import { PasswordService } from "./password.service";
import { RedisModule } from "../redis/redis.module";

@Module({
    imports: [RedisModule],
    providers: [PasswordService],
    exports: [PasswordService],
})
export class PasswordModule { }