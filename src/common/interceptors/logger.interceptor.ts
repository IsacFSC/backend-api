import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    // console.log('interceptando essa requisição');
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    // console.log(request['user']);
    console.log(`[REQUEST] ${method} ${url} - Inicio da requisição`);

    return next.handle().pipe(
      tap(() => {
        console.log(`[RESPONSE] ${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
