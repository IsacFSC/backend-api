import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FilesController],
  providers: [PrismaService],
})
export class FilesModule {}
