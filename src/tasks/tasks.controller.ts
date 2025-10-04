import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/common/role.enum';
import { ActiveUser } from '../auth/param/active-user.decorator';
import { User } from '@prisma/client';

import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('tasks')
//@UseInterceptors(LoggerInterceptor)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Get('/All')
  findAllTasks(@Query() paginationDto: PaginationDto, @Query() filterDto: GetTasksFilterDto) {
    return this.taskService.findAll(paginationDto, filterDto);
  }

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Get(':id')
  findOneTask(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto, @ActiveUser() user: User) {
    return this.taskService.create(createTaskDto, user);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Patch(':id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @ActiveUser() user: User,
  ) {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  removeTask(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: User) {
    return this.taskService.remove(id, user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/assign/:scheduleId')
  assignTask(
    @Param('id', ParseIntPipe) id: number,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.taskService.assignTask(id, scheduleId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/unassign')
  unassignTask(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.unassignTask(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approveTask(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: User) {
    return this.taskService.approveTask(id, user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  rejectTask(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: User) {
    return this.taskService.rejectTask(id, user);
  }
}
