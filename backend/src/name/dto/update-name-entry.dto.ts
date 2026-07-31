import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateNameEntryDto {
  @ApiPropertyOptional({ description: 'Written form of the name' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    example: 'latin',
    minLength: 1,
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(25)
  charset?: string;

  @ApiPropertyOptional({
    example: 'legal',
    description: 'Context key. Must exist in the database.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  context?: string;
}
