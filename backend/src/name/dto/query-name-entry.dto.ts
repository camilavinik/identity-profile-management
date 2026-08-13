import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class QueryNameEntryDto {
  @ApiPropertyOptional({
    example: 'legal',
    description:
      'Optional context key filter. Leave unset to return all names.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsString()
  @MinLength(1)
  context?: string;
}
