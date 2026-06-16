import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNameEntryDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsString()
  @MinLength(1)
  context: string;

  @IsString()
  @MinLength(1)
  charset: string;
}
