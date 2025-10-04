//import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

import { PartialType } from '@nestjs/mapped-types';
import { CreateTasksDto } from './create-tasks.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTasksDto extends PartialType(CreateTasksDto) {
  // O PartialType cria automaticamente as propriedades opcionais baseadas no CreateTasksDto
  // Assim, não é necessário reescrever as validações aqui, a menos que você queira modificá-las.
  @IsBoolean()
  @IsOptional()
  readonly completed?: boolean;
}
