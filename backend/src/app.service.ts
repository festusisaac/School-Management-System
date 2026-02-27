import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'School Management System API v1 - Running Successfully! 🎓';
  }

  getHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'All systems operational',
    };
  }
}
