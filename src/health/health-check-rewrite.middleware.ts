import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HealthCheckUrlRewriteMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if the URL path starts with /healthz
    if (req.url.startsWith('/healthz')) {
      // Check if there is anything after /healthz
      if (req.url.length > '/healthz'.length) {
        // Log the change for debugging
        console.log(`Rewriting URL from: ${req.url} to: /healthz`);
        
        // Rewrite the URL to only include /healthz
        req.url = '/healthz'; 
      }
    }
    next();
  }
}