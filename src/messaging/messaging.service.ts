import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeFileSync, createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Response } from 'express';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async createConversation(createConversationDto: CreateConversationDto, user: any) {
    const { recipientId, subject, message } = createConversationDto;

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new HttpException('Destinatário não encontrado!', HttpStatus.NOT_FOUND);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        subject,
        participants: {
          connect: [{ id: user.id }, { id: recipientId }],
        },
      },
    });

    const newMessage = await this.prisma.message.create({
      data: {
        content: message,
        authorId: user.id,
        conversationId: conversation.id,
      },
    });

    return { conversation, newMessage };
  }

  async getConversations(userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: true,
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            readBy: true,
          },
        },
      },
    });

    return conversations.map((conversation) => {
      const lastMessage = conversation.messages[0];
      const hasUnreadMessages =
        lastMessage &&
        lastMessage.authorId !== userId &&
        !lastMessage.readBy.some((read) => read.userId === userId);
      return { ...conversation, hasUnreadMessages };
    });
  }

  async getUnreadMessagesCount(userId: number): Promise<number> {
    const unreadCount = await this.prisma.message.count({
      where: {
        conversation: {
          participants: {
            some: {
              id: userId,
            },
          },
        },
        readBy: {
          none: {
            userId: userId,
          },
        },
        authorId: {
          not: userId,
        },
      },
    });
    return unreadCount;
  }

  async getMessages(conversationId: number, userId: number) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true, messages: true },
    });

    if (!conversation) {
      throw new HttpException('Conversa não encontrada!', HttpStatus.NOT_FOUND);
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.id === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'Você não tem permissão para ver estas mensagens!',
      );
    }

    // Mark messages as read
    const messageIds = conversation.messages.map((message) => message.id);
    await this.prisma.messageRead.createMany({
      data: messageIds.map((messageId) => ({
        messageId,
        userId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.message.findMany({
      where: { conversationId },
      include: { author: true },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createMessage(
    conversationId: number,
    createMessageDto: CreateMessageDto,
    user: any,
  ) {
    const { content } = createMessageDto;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new HttpException('Conversa não encontrada!', HttpStatus.NOT_FOUND);
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.id === user.id,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'Você não tem permissão para enviar mensagens nesta conversa!',
      );
    }

    return this.prisma.message.create({
      data: {
        content,
        authorId: user.id,
        conversationId,
      },
    });
  }

  async uploadFile(conversationId: number, file: Express.Multer.File, user: any) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new HttpException('Conversa não encontrada!', HttpStatus.NOT_FOUND);
    }

    const isParticipant = conversation.participants.some((participant) => participant.id === user.id);
    if (!isParticipant) {
      throw new ForbiddenException('Você não tem permissão para enviar arquivos nesta conversa!');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = join(process.cwd(), 'backend-api', 'files', fileName);

    try {
      writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new HttpException(
        'Falha ao salvar o arquivo!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const newMessage = await this.prisma.message.create({
      data: {
        content: file.originalname, // Or some other content
        authorId: user.id,
        conversationId: conversationId,
        file: fileName,
        fileMimeType: file.mimetype,
      },
    });

    return newMessage;
  }

  async downloadFile(fileName: string, res: Response) {
    const message = await this.prisma.message.findFirst({
      where: { file: fileName },
    });

    if (!message) {
      throw new HttpException('Arquivo não encontrado!', HttpStatus.NOT_FOUND);
    }

    const filePath = join(process.cwd(), 'backend-api', 'files', fileName);

    if (!existsSync(filePath)) {
      throw new HttpException('Arquivo não encontrado no servidor!', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', message.fileMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${message.content}"`);
    createReadStream(filePath).pipe(res);
  }
}