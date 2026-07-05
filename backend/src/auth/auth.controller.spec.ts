import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signup: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
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
      const tokenResponse = { access_token: 'test-token' };
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
      const tokenResponse = { access_token: 'test-token' };
      authService.login.mockResolvedValue(tokenResponse);

      // Try to login
      const dto = { email: 'test@test.com', password: 'test-password' };
      const result = await controller.login(dto);

      // Check if the login was called with the email and password
      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toBe(tokenResponse);
    });
  });
});
