import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { writeFileSync, createReadStream, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { Skill } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async addUser(scheduleId: number, userId: number, skill: Skill) {
    return this.prisma.usersOnSchedules.create({
      data: {
        scheduleId,
        userId,
        skill,
      },
    });
  }

  async removeUser(scheduleId: number, userId: number) {
    return this.prisma.usersOnSchedules.delete({
      where: {
        userId_scheduleId: {
          userId,
          scheduleId,
        },
      },
    });
  }

  async uploadFile(scheduleId: number, file: Express.Multer.File, uploader: { id: number }) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        users: {
          select: { userId: true }
        }
      }
    });

    if (!schedule) {
      throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const uploadPath = join(process.cwd(), 'backend-api', 'files');
    const filePath = join(uploadPath, fileName);

    try {
      // Garante que o diretório de upload exista
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new HttpException(
        'Falha ao salvar o arquivo!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { 
        file: fileName,
        fileMimeType: file.mimetype 
      },
    });

    // Lógica para criar/enviar mensagem
    const participantIds = schedule.users.map(u => u.userId);
    if (!participantIds.includes(uploader.id)) {
      participantIds.push(uploader.id);
    }

    if (participantIds.length > 1) {
      const conversationSubject = `Escala: ${schedule.name}`;
      
      // Tenta encontrar uma conversa existente com os mesmos participantes e assunto
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          subject: conversationSubject,
          participants: {
            every: { id: { in: participantIds } },
            // Garante que não há outros participantes
            none: { id: { notIn: participantIds } }
          }
        }
      });

      // Se não existir, cria uma nova
      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            subject: conversationSubject,
            participants: {
              connect: participantIds.map(id => ({ id }))
            }
          }
        });
      }

      // Cria a mensagem com o anexo na conversa
      await this.prisma.message.create({
        data: {
          content: `Arquivo da escala: ${file.originalname}`,
          authorId: uploader.id,
          conversationId: conversation.id,
          file: fileName,
          fileMimeType: file.mimetype,
        }
      });
    }

    // Retorna a escala atualizada com suas relações
    return this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
  }

  async downloadAttachedFile(scheduleId: number, res: Response) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || !schedule.file) {
      throw new HttpException('Arquivo não encontrado para esta escala!', HttpStatus.NOT_FOUND);
    }

    const filePath = resolve(process.cwd(), 'backend-api', 'files', schedule.file);

    if (!existsSync(filePath)) {
      throw new HttpException('Arquivo não encontrado no servidor!', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${schedule.file}"`);
    res.setHeader('Content-Type', schedule.fileMimeType || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  }

  async findSchedulesByUser(userId: number) {
    // Busca escalas onde o usuário está vinculado
    return this.prisma.schedule.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
  }

  async create(createScheduleDto: CreateScheduleDto) {
    const { taskIds, userIds, ...scheduleData } = createScheduleDto;
    try {
      // Cria a escala
      const newSchedule = await this.prisma.schedule.create({
        data: {
          name: scheduleData.name,
          description: scheduleData.description,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
        },
      });

      // Vincula usuários à escala
      if (userIds?.length) {
          await this.prisma.$executeRaw`DELETE FROM UsersOnSchedules WHERE scheduleId = ${newSchedule.id}`;
          for (const userId of userIds) {
            await this.prisma.$executeRaw`INSERT INTO UsersOnSchedules (userId, scheduleId) VALUES (${userId}, ${newSchedule.id})`;
          }
      }

      // Vincula tarefas à escala
      if (taskIds?.length) {
          await this.prisma.$executeRaw`UPDATE Task SET scheduleId = ${newSchedule.id} WHERE id IN (${taskIds.join(',')})`;
      }

      return newSchedule;
    } catch (error) {
      throw new HttpException(
        'Falha ao criar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.prisma.schedule.findMany({
      take: Number(limit),
      skip: Number(offset),
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });
    if (!schedule) {
      throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
    }
    return schedule;
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto) {
    const { taskIds, userIds, ...scheduleData } = updateScheduleDto;
    try {
      // Atualiza dados da escala
      const updatedSchedule = await this.prisma.schedule.update({
        where: { id },
        data: {
          name: scheduleData.name,
          description: scheduleData.description,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
        },
      });

      // Atualiza usuários vinculados à escala
      if (userIds) {
        // Remove todos os vínculos antigos
          await this.prisma.$executeRaw`DELETE FROM UsersOnSchedules WHERE scheduleId = ${id}`;
          for (const userId of userIds) {
            await this.prisma.$executeRaw`INSERT INTO UsersOnSchedules (userId, scheduleId) VALUES (${userId}, ${id})`;
          }
      }

      // Atualiza tarefas vinculadas à escala
      if (taskIds) {
        // Remove vínculo de todas as tarefas antigas
          await this.prisma.$executeRaw`UPDATE Task SET scheduleId = NULL WHERE scheduleId = ${id}`;
          for (const taskId of taskIds) {
            await this.prisma.$executeRaw`UPDATE Task SET scheduleId = ${id} WHERE id = ${taskId}`;
          }
      }

      return updatedSchedule;
    } catch (error) {
      throw new HttpException(
        'Falha ao atualizar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: number) {
    try {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id },
      });
      if (!schedule) {
        throw new HttpException('Escala não encontrada!', HttpStatus.NOT_FOUND);
      }
      await this.prisma.schedule.delete({
        where: { id },
      });
      return { message: 'Escala deletada com sucesso!' };
    } catch (error) {
      throw new HttpException(
        'Falha ao deletar escala!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
