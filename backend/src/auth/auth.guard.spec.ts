import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

type MockRequest = {
  headers?: Record<string, string>;
  user?: unknown;
};

const mockExecutionContext = (request: MockRequest = {}): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();
    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('allow public routes without a token', async () => {
    // Mock public route
    reflector.getAllAndOverride.mockReturnValue(true);

    // Try to activate the guard
    const result = await guard.canActivate(mockExecutionContext());

    // Check the request was allowed without checking the token
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects requests without an authorization header', async () => {
    // Mock private route
    reflector.getAllAndOverride.mockReturnValue(false);

    // Mock request without authorization header
    const ctx = mockExecutionContext({ headers: {} });

    // Try to activate the guard and expect it to throw
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects requests with a non-Bearer authorization header', async () => {
    // Mock private route
    reflector.getAllAndOverride.mockReturnValue(false);

    // Try to activate the guard and expect it to throw
    const ctx = mockExecutionContext({
      headers: { authorization: 'Basic abc123' },
    });

    // Check the request was rejected
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects requests with an invalid token', async () => {
    // Mock private route and failing token verification
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    // Mock request with a Bearer token
    const ctx = mockExecutionContext({
      headers: { authorization: 'Bearer test-token' },
    });

    // Try to activate the guard and expect it to throw
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('allows requests with a valid token and attaches the user', async () => {
    // Mock private route and valid token verification
    reflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'test-user-id', email: 'test@test.com' };
    jwtService.verifyAsync.mockResolvedValue(payload);

    // Mock request with a Bearer token
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer test-token' },
    };
    const ctx = mockExecutionContext(request);

    // Try to activate the guard
    const result = await guard.canActivate(ctx);

    // Check the request was allowed and the payload was attached as user
    expect(result).toBe(true);
    expect(request.user).toBe(payload);
  });
});
