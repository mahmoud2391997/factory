import { Controller, Get } from '@nestjs/common'

@Controller('/api/health')
export class HealthController {
  @Get()
  health() {
    return { success: true, data: { status: 'ok' }, message: 'OK' }
  }
}

