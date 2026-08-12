import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { RateLimitService } from './rate-limit.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AuthTokenDto })
  signup(@Body() dto: SignupDto, @Ip() ip: string) {
    // Rate limit: 1 signup every 5 minutes, max 3 per hour per IP
    this.rateLimit.check(`signup-ip:${ip}`, 5 * 60 * 1000, 1);
    this.rateLimit.check(`signup-ip-hour:${ip}`, 60 * 60 * 1000, 3);
    return this.authService.signup(dto.email, dto.password);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokenDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    const email = dto.email.toLowerCase();

    // Rate limit: 1 every 30s, max 5 per hour per IP
    this.rateLimit.check(`forgot-ip:${ip}`, 30 * 1000, 1);
    this.rateLimit.check(`forgot-ip-hour:${ip}`, 60 * 60 * 1000, 5);

    // Rate limit: 1 every 30s, max 3 per hour per email
    this.rateLimit.check(`forgot-email:${email}`, 30 * 1000, 1);
    this.rateLimit.check(`forgot-email-hour:${email}`, 60 * 60 * 1000, 3);

    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
