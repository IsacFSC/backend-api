import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  Request,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Response } from 'express';
import { generateSchedulePDF } from './pdf.utils';
import { Res } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/common/role.enum';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';

import { AddUserToScheduleDto } from './dto/add-user-to-schedule.dto';

@UseGuards(AuthTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('schedules')
export class SchedulesController {
  @Get(':id/pdf')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  async downloadSchedulePDF(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const schedule = await this.schedulesService.findOne(id);
    const pdfBuffer = await generateSchedulePDF(schedule);
    const fileName = `escala_${schedule.name.replace(/\s+/g, '_')}_${new Date(schedule.startTime).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(pdfBuffer);
  }
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Post(':id/upload')
  @Roles(Role.ADMIN, Role.LEADER)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.schedulesService.uploadFile(id, file, req.user);
  }

  @Get(':id/uploaded-file')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  downloadAttachedFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.schedulesService.downloadAttachedFile(id, res);
  }


  @Post(':id/users/:userId')
  @Roles(Role.ADMIN)
  addUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() addUserToScheduleDto: AddUserToScheduleDto,
  ) {
    return this.schedulesService.addUser(id, userId, addUserToScheduleDto.skill);
  }

  @Delete(':id/users/:userId')
  @Roles(Role.ADMIN)
  removeUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.schedulesService.removeUser(id, userId);
  }


  @Get('my-schedules')
  @Roles(Role.USER, Role.LEADER, Role.ADMIN)
  async getMySchedules(@Request() req: any) {
    // req.user.id deve estar disponível pelo AuthTokenGuard
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Usuário não autenticado', HttpStatus.UNAUTHORIZED);
    }
    return this.schedulesService.findSchedulesByUser(userId);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.schedulesService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.LEADER, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.remove(id);
  }

  // Skill management endpoints
  // Endpoints de Skill removidos pois não existem mais no serviço
}
