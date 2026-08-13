import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

const sendMail = jest.fn();
const createTransport = jest.fn(() => ({ sendMail }));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    sendMail.mockReset();
    createTransport.mockClear();
    createTransport.mockReturnValue({ sendMail });
    (nodemailer.createTransport as jest.Mock).mockImplementation(
      createTransport,
    );

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(MailService);
  });

  it('should throw if SMTP credentials are missing', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      service.sendPasswordReset('user@test.com', 'http://reset-link.test.com'),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(createTransport).not.toHaveBeenCalled();
  });

  it('should throw if SMTP_PASSWORD is missing', async () => {
    configService.get.mockImplementation((key: string) =>
      key === 'SMTP_USER' ? 'identityprofilemanagement@gmail.com' : undefined,
    );

    await expect(
      service.sendPasswordReset('user@test.com', 'http://reset-link.test.com'),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(createTransport).not.toHaveBeenCalled();
  });

  it('should send a password reset email via Gmail SMTP', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_USER') return 'identityprofilemanagement@gmail.com';
      if (key === 'SMTP_PASSWORD') return 'app-password';
      if (key === 'MAIL_FROM')
        return 'IPM <identityprofilemanagement@gmail.com>';
      return undefined;
    });
    sendMail.mockResolvedValue({ messageId: 'msg-1' });

    await service.sendPasswordReset(
      'user@test.com',
      'http://localhost:5173/reset-password?token=abc',
    );

    expect(createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: 'identityprofilemanagement@gmail.com',
        pass: 'app-password',
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'IPM <identityprofilemanagement@gmail.com>',
        to: 'user@test.com',
        subject: 'Reset your password',
      }),
    );
  });

  it('should default MAIL_FROM to the SMTP user', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_USER') return 'identityprofilemanagement@gmail.com';
      if (key === 'SMTP_PASSWORD') return 'app-password';
      return undefined;
    });
    sendMail.mockResolvedValue({ messageId: 'msg-1' });

    await service.sendPasswordReset(
      'user@test.com',
      'http://localhost:5173/reset-password?token=abc',
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'IPM <identityprofilemanagement@gmail.com>',
      }),
    );
  });

  it('should throw if sending fails', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_USER') return 'identityprofilemanagement@gmail.com';
      if (key === 'SMTP_PASSWORD') return 'app-password';
      return undefined;
    });
    sendMail.mockRejectedValue(new Error('smtp failed'));

    await expect(
      service.sendPasswordReset('user@test.com', 'http://reset-link.test.com'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
