import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ access_token: string; email: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await this.prisma.user.create({
      data: { email, password_hash: hashedPassword },
    });

    return this.generateAccessToken(createdUser.id, createdUser.email);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const passwordCorrect = user?.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!passwordCorrect) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateAccessToken(user!.id, user!.email);
  }

  private async generateAccessToken(sub: string, email: string) {
    return {
      access_token: await this.jwtService.signAsync({ sub, email }),
      email,
    };
  }
}
