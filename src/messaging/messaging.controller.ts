import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Body,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthTokenGuard } from '../auth/guard/auth-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/common/role.enum';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Response } from 'express';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: any,
  ) {
    return this.messagingService.createConversation(
      createConversationDto,
      req.user,
    );
  }

  @Get('conversations')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  getConversations(@Request() req: any) {
    return this.messagingService.getConversations(req.user.id);
  }

  @Get('conversations/unread-count')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  getUnreadMessagesCount(@Request() req: any) {
    return this.messagingService.getUnreadMessagesCount(req.user.id);
  }

  @Get('conversations/:id/messages')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  getMessages(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.messagingService.getMessages(id, req.user.id);
  }

  @Post('conversations/:id/messages')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  createMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ) {
    return this.messagingService.createMessage(
      id,
      createMessageDto,
      req.user,
    );
  }

  @Post('conversations/:id/messages/upload')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.messagingService.uploadFile(id, file, req.user);
  }

  @Get('download/:fileName')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    return this.messagingService.downloadFile(fileName, res);
  }
}
