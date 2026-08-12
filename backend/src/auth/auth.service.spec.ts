import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

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
    };
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should sign up a new user', async () => {
      // Mock user does not exist yet, password hashing, user creation, and token generation
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
});
