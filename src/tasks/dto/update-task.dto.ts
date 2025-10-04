import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
