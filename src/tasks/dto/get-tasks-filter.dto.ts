import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class GetTasksFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
