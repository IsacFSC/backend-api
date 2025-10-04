import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    //console.log('[MIDDLEWARE] Passando...');
    const authorization = req.headers.authorization;
    if (authorization) {
      req['user'] = {
        token: authorization,
        role: 'admin',
      };
    }
    next();
  }
}
