import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTasksDto {
  @IsString({ message: 'O nome precisa ser preenchido' })
  @MinLength(3, { message: 'O nome deve ter pelo menos 5 caracteres' })
  @IsNotEmpty({ message: 'O nome não pode ser vazio' })
  readonly name: string;

  @IsString({ message: 'A descrição precisa ser preenchida' })
  @MinLength(3, { message: 'A descrição deve ter pelo menos 10 caracteres' })
  @IsNotEmpty({ message: 'A descrição não pode ser vazia' })
  readonly description: string;
}
