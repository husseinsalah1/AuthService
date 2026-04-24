import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { AppLogger } from "src/shared/logger";
import { IdentifierType } from "../auth/enums/identifier-type.enum";



const OTP_TTL_SECONDS = 10;       // 10 minutes
const OTP_KEY_PREFIX = 'otp:';
const ATTEMPT_KEY_PREFIX = 'otp_attempts:';
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
    private readonly logger = new AppLogger(OtpService.name)
    constructor(private readonly redisService: RedisService) { }


    // SMS 
    async viaPhone(phone: string, code: string) {
        const message = `Your verification code is ${code}. It was sent to ${phone}. This code will expire in 10 minutes. Do not share it with anyone.`;
        return message
    }

    //Email 
    async viaEmail(email: string, code: string) {
        const message = `Your verification code is ${code}. It was sent to ${email}. This code will expire in 10 minutes. Do not share it with anyone.`;
        return message
    }
    // Send

    async sendOtp(identifier: string, type: string) {
        const otp = this.generateOtp()
        const otpKey = `${OTP_KEY_PREFIX}${identifier}`
        const attemptKey = `${ATTEMPT_KEY_PREFIX}${identifier}`

        // Store OTP and Reset attempts automatically 

        await Promise.all([
            this.redisService.set(otpKey, otp, OTP_TTL_SECONDS),
            this.redisService.del(attemptKey)
        ])
        let message = ""
        if (type === IdentifierType.PHONE_NUMBER) {
            message = await this.viaPhone(identifier, otp)
        } else {
            message = await this.viaEmail(identifier, otp)
        }

        this.logger.log(`[DEV ONLY] ${message}`)

        return { message: 'OTP sent successfully', expiresInMinutes: 10 };
    }

    async verifyOtp(identifier: string, code: string) {
        const otpKey = `${OTP_KEY_PREFIX}${identifier}`
        const attemptKey = `${ATTEMPT_KEY_PREFIX}${identifier}`

        // 1. Brute Force guard
        const attempts = await this.redisService.incr(attemptKey)
        if (attempts === 1) {
            const remaining = await this.redisService.ttl(otpKey)
            if (remaining > 0) await this.redisService.expire(attemptKey, remaining)
        }


        if (attempts > MAX_ATTEMPTS) {
            throw new BadRequestException(
                'Too many failed attempts. Please request a new OTP.',
            );
        }

        // 2. Fetch stored OTP
        const storedOtp = await this.redisService.get(otpKey);
        if (!storedOtp) {
            throw new NotFoundException('OTP expired or not found. Please request a new one.');
        }

        // 3. Compare
        if (storedOtp !== code) {
            throw new BadRequestException(
                `Invalid OTP. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`,
            );
        }

        // 4. Consume — delete both keys after success
        await this.redisService.del(otpKey, attemptKey);

        return { message: 'OTP verified successfully' };
    }

    async getOtpStatus(phone: string): Promise<{ remainingSeconds: number; expired: boolean }> {
        const ttl = await this.redisService.ttl(`${OTP_KEY_PREFIX}${phone}`);
        return {
            remainingSeconds: ttl < 0 ? 0 : ttl,
            expired: ttl < 0,
        };
    }

    private generateOtp(): string {
        return "123456"
    }
}