import {
  HttpException,
  HttpStatus,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Task, User } from '@prisma/client';
import { Role } from 'src/auth/common/role.enum';
import { TaskStatus } from '@prisma/client';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

@Injectable()
export class TasksService {
  async approveTask(id: number, user: User) {
    const findTask = await this.prisma.task.findFirst({ where: { id } });
    if (!findTask) {
      throw new HttpException('Essa tarefa não existe!', HttpStatus.NOT_FOUND);
    }
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para aprovar essa tarefa!');
    }
    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.APPROVED },
    });
  }

  async rejectTask(id: number, user: User) {
    const findTask = await this.prisma.task.findFirst({ where: { id } });
    if (!findTask) {
      throw new HttpException('Essa tarefa não existe!', HttpStatus.NOT_FOUND);
    }
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para rejeitar essa tarefa!');
    }
    return this.prisma.task.update({
      where: { id },
      data: { status: TaskStatus.REJECTED },
    });
  }
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto?: PaginationDto, filterDto?: GetTasksFilterDto) {
    const { limit = 10, offset = 0 } = paginationDto || {};
    const { name, status, userId, startDate, endDate } = filterDto || {};

    const whereClause: any = {};

    if (name) {
      whereClause.name = { contains: name, mode: 'insensitive' };
    }

    if (status) {
      whereClause.status = status;
    }

    if (userId) {
      whereClause.userId = parseInt(userId, 10);
    }

    if (startDate) {
      whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) };
    }

    const [tasks, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where: whereClause,
        include: { user: true },
        take: Number(limit),
        skip: Number(offset),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.task.count({ where: whereClause }),
    ]);

    return { data: tasks, total, page: Math.floor(offset / limit) + 1, limit };
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (task?.name) return task;
    throw new HttpException('Tarefa não encontrada', HttpStatus.NOT_FOUND);
  }

  async create(createTaskDto: CreateTaskDto, user: User) {
    try {
      const newTask = await this.prisma.task.create({
        data: {
          name: createTaskDto.name,
          description: createTaskDto.description,
          status: createTaskDto.status || TaskStatus.PENDING,
          userId: user.id,
        },
      });
      console.log(newTask);
      return newTask;
    } catch (err) {
      console.log('erro aqui', err);
      throw new HttpException(
        'Falha ao cadastrar tarefa!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    const findTask = await this.prisma.task.findFirst({
      where: {
        id: id,
      },
    });
    if (!findTask) {
      throw new HttpException('Essa tarefa não existe!', HttpStatus.NOT_FOUND);
    }

    if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para editar essa tarefa!',
      );
    }

    const task = await this.prisma.task.update({
      where: {
        id: findTask.id,
      },
      data: {
        name: updateTaskDto?.name ? updateTaskDto.name : findTask.name,
        description: updateTaskDto?.description
          ? updateTaskDto.description
          : findTask.description,
        status: updateTaskDto?.status
          ? updateTaskDto.status
          : findTask.status,
      },
    });
    return task;
  }

  async remove(id: number, user: User) {
    try {
      const findTask = await this.prisma.task.findFirst({
        where: {
          id: id,
        },
      });
      if (!findTask) {
        throw new HttpException(
          'Essa tarefa não existe!',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.role !== Role.ADMIN && findTask.userId !== user.id) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar essa tarefa!',
        );
      }
      await this.prisma.task.delete({
        where: {
          id: findTask.id,
        },
      });
      return { message: 'Tarefa deletada com sucesso!' };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Erro ao deletar a tarefa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async assignTask(taskId: number, scheduleId: number) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { scheduleId },
    });
  }

  async unassignTask(taskId: number) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { scheduleId: null },
    });
  }
}