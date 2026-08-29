import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'trexio-secret-key-change-in-prod';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  roles?: string[];
  tenant_id?: string;
  _is_impersonating?: boolean;
  _impersonated_by?: string;
  _impersonator_email?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        detail: 'Akses ditolak. Silakan login terlebih dahulu.',
      });
    }

    try {
      // Check for impersonation cookie token first if exists
      const impToken = request.cookies?.imp_token;
      if (impToken) {
        try {
          const impDecoded = jwt.verify(impToken, JWT_SECRET) as any;
          if (impDecoded && impDecoded.sub) {
            request.user = {
              id: impDecoded.sub,
              email: impDecoded.email || '',
              role: impDecoded.role || 'user',
              roles: impDecoded.roles || ['user'],
              tenant_id: impDecoded.tenant_id || 'tenant_default',
              _is_impersonating: true,
              _impersonated_by: impDecoded.actor,
              _impersonator_email: impDecoded.actor_email,
            };
            return true;
          }
        } catch {
          // Fall back to main token if impToken is invalid or expired
        }
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException({
          detail: 'Token tidak valid atau telah kedaluwarsa.',
        });
      }

      request.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user',
        roles: decoded.roles || ['user'],
        tenant_id: decoded.tenant_id || 'tenant_default',
      };

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        detail: 'Sesi login telah berakhir, silakan login kembali.',
      });
    }
  }

  private extractToken(request: any): string | null {
    // 1. From cookies
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }

    // 2. From Authorization header Bearer token
    const authHeader = request.headers?.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1];
      }
    }

    return null;
  }
}
