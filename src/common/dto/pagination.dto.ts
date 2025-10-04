import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @Min(0)
  @Max(50)
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit: number;

  @Min(0)
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  offset: number;
}
