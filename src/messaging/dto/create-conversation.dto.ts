import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  recipientId: number;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
