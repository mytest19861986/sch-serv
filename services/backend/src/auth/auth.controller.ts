import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

interface LoginBody { username?: unknown; password?: unknown; }

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginBody): Promise<{ accessToken: string }> {
    const keys = Object.keys(body);
    if (keys.some((key) => key !== 'username' && key !== 'password')) throw new BadRequestException();
    if (typeof body.username !== 'string' || typeof body.password !== 'string') {
      // Same privacy-safe response as failed verification; no account enumeration.
      return this.authService.login('', '');
    }
    return this.authService.login(body.username, body.password);
  }
}
