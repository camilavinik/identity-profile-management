import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    login: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup with email and password', async () => {
      // Mock signup response
      const tokenResponse = {
        access_token: 'test-token',
        email: 'test@test.com',
      };
      authService.signup.mockResolvedValue(tokenResponse);

      // Try to signup
      const dto = { email: 'test@test.com', password: 'test-password' };
      const result = await controller.signup(dto);

      // Check if the signup was called with the email and password
      expect(authService.signup).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toBe(tokenResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login with email and password', async () => {
      // Mock login response
      const tokenResponse = {
        access_token: 'test-token',
        email: 'test@test.com',
      };
      authService.login.mockResolvedValue(tokenResponse);

      // Try to login
      const dto = { email: 'test@test.com', password: 'test-password' };
      const result = await controller.login(dto);

      // Check if the login was called with the email and password
      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toBe(tokenResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with email', async () => {
      const response = {
        message:
          'A password reset email has been sent to the provided email address if the user exists.',
      };
      authService.forgotPassword.mockResolvedValue(response);

      const dto = { email: 'test@test.com' };
      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email);
      expect(result).toBe(response);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with token and password', async () => {
      const response = { message: 'Password has been updated' };
      authService.resetPassword.mockResolvedValue(response);

      const dto = { token: 'reset-token', password: 'new-password' };
      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.password,
      );
      expect(result).toBe(response);
    });
  });
});
