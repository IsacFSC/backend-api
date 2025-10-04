import { PartialType } from '@nestjs/mapped-types';
import { UpdateUserDto } from './update-user.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/auth/common/role.enum';

export class UpdateUserByAdminDto extends PartialType(UpdateUserDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
