import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthCheckUrlRewriteMiddleware } from './health-check-rewrite.middleware';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HealthCheckUrlRewriteMiddleware)
      .forRoutes({ path: 'healthz*path', method: RequestMethod.ALL }); // Apply to any route starting with healthz
  }
}


