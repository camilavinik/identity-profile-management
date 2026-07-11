import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateNameEntryDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  charset?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  context?: string;
}
