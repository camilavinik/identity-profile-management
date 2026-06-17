import { IsOptional, IsString, MinLength } from 'class-validator';

export class QueryNameEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  context?: string;
}
