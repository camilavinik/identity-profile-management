import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class HistoryQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 'legal',
    description:
      'Optional context key filter. Leave unset to return all entries.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  @IsString()
  @MinLength(1)
  context?: string;
}
