import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  getStatus() {
    return { status: 'Auth module active' };
  }

  @Get('diagnostics')
  async getDiagnostics(@Req() req: Request) {
    const rawToken =
      req.cookies?.access_token ||
      (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : undefined);

    return this.authService.getDiagnostics(rawToken);
  }

  @Post(['facebook', 'apple'])
  @HttpCode(HttpStatus.BAD_REQUEST)
  disabledSocialAuth() {
    throw new BadRequestException({
      detail: 'Autentikasi Facebook dan Apple telah dinonaktifkan. Silakan gunakan Google atau Email/Password.',
    });
  }

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseLogin(
    @Body() body: { idToken?: string; email?: string; name?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.authService.loginWithFirebase(body.idToken || '', body.email, body.name);

    res.cookie('access_token', authResult.access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return authResult;
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() body: { idToken?: string; email?: string; name?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.authService.loginWithFirebase(body.idToken || '', body.email, body.name);

    res.cookie('access_token', authResult.access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return authResult;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password?: string; pass?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const password = body.password || body.pass || '';
    const user = await this.authService.validateUser(body.email, password);

    if (!user) {
      throw new UnauthorizedException({
        detail: 'Email atau password salah.',
      });
    }

    const authResult = await this.authService.login(user);

    // Set cookie
    res.cookie('access_token', authResult.access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return authResult;
  }

  @Post('register')
  async register(
    @Body() body: { name?: string; email: string; password: string; phone?: string; role?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResult = await this.authService.register(body);

    res.cookie('access_token', authResult.access_token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return authResult;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('imp_token', { path: '/' });
    return { message: 'Logout berhasil' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
