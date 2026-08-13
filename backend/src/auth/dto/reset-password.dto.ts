import { IntersectionType, PickType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { SignupDto } from './signup.dto';

class ResetPasswordTokenDto {
  @IsString()
  token!: string;
}

export class ResetPasswordDto extends IntersectionType(
  ResetPasswordTokenDto,
  PickType(SignupDto, ['password'] as const),
) {}
