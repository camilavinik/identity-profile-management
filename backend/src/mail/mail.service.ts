import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    if (!user || !pass) {
      throw new ServiceUnavailableException('Email service is not configured');
    }

    const from = this.configService.get<string>('MAIL_FROM') ?? `IPM <${user}>`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Reset your password',
        text: `To reset your password, please click the link below:\n\n${resetLink}`,
        html: `<p>To reset your password, please click the link below:</p><p><a href="${resetLink}" target="_blank">${resetLink}</a></p>`,
      });
    } catch {
      throw new ServiceUnavailableException('Failed to send email');
    }
  }
}
