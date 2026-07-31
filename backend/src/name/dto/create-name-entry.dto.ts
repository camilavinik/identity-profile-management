import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNameEntryDto {
  @ApiPropertyOptional({ description: 'Written form of the name' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({
    example: 'legal',
    description: 'Context key. Must exist in the database.',
  })
  @IsString()
  @MinLength(1)
  context!: string;

  @ApiProperty({
    example: 'latin',
    minLength: 1,
    maxLength: 25,
    description: 'Character set or script used to write the name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(25)
  charset!: string;
}
