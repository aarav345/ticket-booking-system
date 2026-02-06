import type { Request, Response } from 'express';
import { pool } from '@/database/pg.client';
import { logger } from '../common/logger/logger';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheckStatus;
    memory: HealthCheckStatus;
    system: HealthCheckStatus;
  };
  version?: string;
  environment?: string;
}

interface HealthCheckStatus {
  status: 'up' | 'down';
  message?: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

interface DatabaseInfoResult {
  time: Date;
  version: string;
}

export class HealthController {
  liveness(_req: Request, res: Response): void {
    try {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Application is running',
      });
    } catch (error) {
      logger.error({ err: error }, 'Liveness check failed');
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Application is not responding',
      });
    }
  }

  /**
   * Readiness probe - Is the application ready to serve traffic?
   * Used by load balancers to know if they should route traffic to this instance
   */
  async readiness(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const checks: HealthCheckResponse['checks'] = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      system: this.checkSystem(),
    };

    const isHealthy = Object.values(checks).every(
      check => check.status === 'up'
    );
    const totalTime = Date.now() - startTime;

    const response: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100,
      checks,
      version: process.env.APP_VERSION ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    };

    logger.info(
      {
        health: response,
        responseTime: totalTime,
      },
      `Health check completed in ${totalTime}ms - ${response.status}`
    );

    res.status(isHealthy ? 200 : 503).json(response);
  }

  private async checkDatabase(): Promise<HealthCheckStatus> {
    const startTime = Date.now();
    let client;

    try {
      // Get client from pool
      client = await pool.connect();

      // Query with proper type annotation
      const result = await client.query<DatabaseInfoResult>(
        'SELECT NOW() as time, version() as version'
      );

      const responseTime = Date.now() - startTime;

      const poolStats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };

      // Extract version safely with optional chaining
      const fullVersion = result.rows[0]?.version ?? '';
      const version = fullVersion.split(' ')[1] ?? 'unknown';

      return {
        status: 'up',
        message: 'Database connection is healthy',
        responseTime,
        details: {
          type: 'PostgreSQL',
          connected: true,
          version,
          serverTime: result.rows[0]?.time,
          pool: poolStats,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error({ err: error }, 'Database health check failed');

      return {
        status: 'down',
        message: 'Database connection failed',
        responseTime,
        details: {
          type: 'PostgreSQL',
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  private checkMemory(): HealthCheckStatus {
    const memoryUsage = process.memoryUsage();
    const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
    const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;

    // Consider unhealthy if using more than 90% of heap
    const isHealthy = memoryUsagePercent < 90;

    return {
      status: isHealthy ? 'up' : 'down',
      message: isHealthy ? 'Memory usage is normal' : 'Memory usage is high',
      details: {
        heapUsedMB: Math.round(usedMemoryMB * 100) / 100,
        heapTotalMB: Math.round(totalMemoryMB * 100) / 100,
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
        rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        externalMB:
          Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
        arrayBuffersMB:
          Math.round((memoryUsage.arrayBuffers / 1024 / 1024) * 100) / 100,
      },
    };
  }

  private checkSystem(): HealthCheckStatus {
    const uptime = process.uptime();
    const uptimeHours = uptime / 3600;
    const uptimeDays = uptimeHours / 24;

    return {
      status: 'up',
      message: 'System is operational',
      details: {
        uptime: {
          seconds: Math.round(uptime),
          hours: Math.round(uptimeHours * 100) / 100,
          days: Math.round(uptimeDays * 100) / 100,
        },
        process: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          pid: process.pid,
        },
        cpu: {
          usage: process.cpuUsage(),
        },
      },
    };
  }
}

export const healthController = new HealthController();
