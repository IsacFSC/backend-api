import { Controller, Get, Param, ParseIntPipe, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Get(':id')
  async getFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) {
      throw new HttpException('Arquivo não encontrado', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.send(file.data);
  }
}
