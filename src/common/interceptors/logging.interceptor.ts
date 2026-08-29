import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get?.('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode || 200;
          const delay = Date.now() - now;
          this.logger.log(
            `[${method}] ${originalUrl || request.url} - ${statusCode} (${delay}ms) - ${ip || '127.0.0.1'}`,
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          const statusCode = error.status || error.statusCode || 500;
          this.logger.error(
            `[${method}] ${originalUrl || request.url} - ${statusCode} (${delay}ms) - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
