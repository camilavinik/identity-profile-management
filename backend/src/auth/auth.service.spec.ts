import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let mailService: {
    sendPasswordReset: jest.Mock;
  };
  let configService: {
    getOrThrow: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    mailService = {
      sendPasswordReset: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn().mockReturnValue('http://localhost:5173'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should sign up a new user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@test.com',
      });
      jwtService.signAsync.mockResolvedValue('test-token');

      // Try to sign up a new user
      const result = await service.signup('Test@test.com', 'test-password');

      // Check if the user was created with the hashed password
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'test@test.com', mode: 'insensitive' },
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@test.com', password_hash: 'hashed-password' },
      });

      // Check if the token was returned
      expect(result).toEqual({
        access_token: 'test-token',
        email: 'test@test.com',
      });
    });

    it('should throw an error if the user already exists', async () => {
      // Mock user already exists
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-id',
        email: 'test@test.com',
      });

      // Try to sign up and expect it to throw
      await expect(
        service.signup('TEST@test.com', 'test-password'),
      ).rejects.toThrow(ConflictException);

      // Check the create was never called
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      // Mockuser exists and password is correct
      const existingUser = {
        id: 'existing-id',
        email: 'test@test.com',
        password_hash: 'hashed-password',
      };
      prisma.user.findFirst.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('test-token');

      // Try to login
      const result = await service.login('TEST@test.com', 'test-password');

      // Check if the user was logged in
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: 'test@test.com', mode: 'insensitive' },
        },
      });
      expect(result).toEqual({
        access_token: 'test-token',
        email: 'test@test.com',
      });
    });

    it('should throw an error if the user does not exist', async () => {
      // Mock user does not exist
      prisma.user.findFirst.mockResolvedValue(null);

      // Try to log in and expect it to throw
      await expect(
        service.login('test@test.com', 'test-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if the password is incorrect', async () => {
      // Mock user exists and password is incorrect
      prisma.user.findFirst.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@test.com',
        password_hash: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Try to log in and expect it to throw
      await expect(
        service.login('test@test.com', 'test-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    const genericMessage =
      'A password reset email has been sent to the provided email address if the user exists.';

    it('should return a generic message when the email is unknown', async () => {
      // Mock user does not exist
      prisma.user.findFirst.mockResolvedValue(null);

      // Try to forgot password and expect it to return a generic message
      await expect(service.forgotPassword('missing@test.com')).resolves.toEqual(
        { message: genericMessage },
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('should store a reset token and send email when the user exists', async () => {
      // Mock user exists
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      prisma.user.update.mockResolvedValue({});
      mailService.sendPasswordReset.mockResolvedValue(undefined);

      // Try to forgot password and expect it to return a generic message
      await expect(service.forgotPassword('TEST@test.com')).resolves.toEqual({
        message: genericMessage,
      });

      // Check if the reset token was stored
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password_reset_token: expect.any(String) as string,
          password_reset_expires_at: expect.any(Date) as Date,
        },
      });
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        'test@test.com',
        expect.stringContaining('/reset-password?token=') as string,
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw when the token is invalid or expired', async () => {
      // Mock user does not exist
      prisma.user.findFirst.mockResolvedValue(null);

      // Try to reset password and expect it to throw
      await expect(
        service.resetPassword('bad-token', 'new-password'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should update the password and clear the reset token', async () => {
      // Mock user exists
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue({});

      // Try to reset password and expect it to return a success message
      await expect(
        service.resetPassword('good-token', 'new-password'),
      ).resolves.toEqual({ message: 'Password has been updated' });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          password_reset_token: 'good-token',
          password_reset_expires_at: { gt: expect.any(Date) as Date },
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password_hash: 'new-hash',
          password_reset_token: null,
          password_reset_expires_at: null,
        },
      });
    });
  });
});
