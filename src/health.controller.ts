import { Controller, Get, Head } from '@nestjs/common';
import { Public } from '@/shared/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'auth-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Head()
  headCheck() {
    return;
  }
}