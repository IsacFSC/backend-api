import { IsDateString, IsNotEmpty, IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @IsDateString()
  @IsNotEmpty()
  endTime: Date;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  taskIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds?: number[];
}
