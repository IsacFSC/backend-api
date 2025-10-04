import { IsEnum } from 'class-validator';
import { Skill } from '@prisma/client';

export class AddUserToScheduleDto {
  @IsEnum(Skill)
  skill: Skill;
}
