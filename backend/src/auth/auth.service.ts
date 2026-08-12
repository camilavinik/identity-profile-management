import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ access_token: string; email: string }> {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await this.prisma.user.create({
      data: { email: normalizedEmail, password_hash: hashedPassword },
    });

    return this.generateAccessToken(createdUser.id, createdUser.email);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; email: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email.toLowerCase(), mode: 'insensitive' },
      },
    });

    const passwordCorrect = user?.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!passwordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateAccessToken(user!.id, user!.email);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const message =
      'A password reset email has been sent to the provided email address if the user exists.';
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
    });
    if (!user) {
      return { message };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: token,
        password_reset_expires_at: expiresAt,
      },
    });

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailService.sendPasswordReset(user.email, resetLink);

    return { message };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        password_reset_token: token,
        password_reset_expires_at: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
    });

    return { message: 'Password has been updated' };
  }

  private async generateAccessToken(sub: string, email: string) {
    return {
      access_token: await this.jwtService.signAsync({ sub, email }),
      email,
    };
  }
}
