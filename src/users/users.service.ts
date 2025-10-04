import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { User } from '@prisma/client';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { AuthService } from 'src/auth/auth.service';
import jwtConfig from 'src/auth/config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto'; // Import the new DTO
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        Tasks: true,
        role: true,
      },
    });
    if (user) return user;

    throw new HttpException('Usuário não encontrado!', HttpStatus.BAD_REQUEST);
  }

  async findAll(paginationDto?: PaginationDto, search?: string, active?: string, role?: string) {
    const { limit = 10, offset = 0 } = paginationDto || {};

    let filters: any[] = [];
    if (search && search.trim() !== '') {
      filters.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      });
    }
    if (typeof active !== 'undefined' && active !== 'all') {
      filters.push({ active: active === 'true' });
    }
    if (typeof role !== 'undefined' && role !== 'all' && ['ADMIN', 'LEADER', 'USER'].includes(role)) {
      filters.push({ role });
    }
    let whereClause: any = {};
    if (filters.length === 1) {
      whereClause = filters[0];
    } else if (filters.length > 1) {
      whereClause = { AND: filters };
    } // se filters.length === 0, whereClause permanece {}

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereClause,
        take: Number(limit),
        skip: Number(offset),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return { users, total };
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password,
      );

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: passwordHash,
          role: createUserDto.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      return user;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao cadastrar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, activeUser: User) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new HttpException('Usuário não existe!', HttpStatus.BAD_REQUEST);
      }

      const dataUser: { name?: string; passwordHash?: string } = {
        name: updateUserDto.name ? updateUserDto.name : user.name,
      };
      if (updateUserDto?.password) {
        const passwordHash = await this.hashingService.hash(
          updateUserDto?.password,
        );
        dataUser['passwordHash'] = passwordHash;
      }
      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: updateUserDto.name ? updateUserDto.name : user.name,
          passwordHash: dataUser?.passwordHash
            ? dataUser?.passwordHash
            : user.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          Tasks: true,
          role: true,
        },
      });
      return updateUser;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao atualizar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(id: number, activeUser: User) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });
      if (!user) {
        throw new HttpException('Usuário não existe', HttpStatus.BAD_REQUEST);
      }
      await this.prisma.user.delete({
        where: {
          id: user.id,
        },
      });
      return {
        message: 'Usuário deletado com sucesso!',
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao deletar usuário!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadAvatarImage(user: User, file: Express.Multer.File) {
    try {
      const mimeType = file.mimetype;
      const fileExtension = path
        .extname(file.originalname)
        .toLowerCase()
        .substring(1);
      console.log(mimeType);
      console.log(fileExtension);
      const fileName = `${user.id}.${fileExtension}`;
      const fileLocale = path.resolve(process.cwd(), 'files', fileName);
      const avatarPath = `/files/${fileName}`;
      await fs.writeFile(fileLocale, file.buffer);

      const updatedUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: avatarPath,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          passwordHash: true,
          active: true,
        },
      });

      const newToken = await this.authService.generateToken(updatedUser);

      return { user: updatedUser, token: newToken };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao fazer upload da imagem!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async removeAvatarImage(user: User) {
    try {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userRecord || !userRecord.avatar) {
        throw new HttpException('Usuário não possui avatar!', HttpStatus.BAD_REQUEST);
      }

      const fileName = path.basename(userRecord.avatar);
      const fileLocale = path.resolve(process.cwd(), 'files', fileName);

      // Check if file exists before attempting to delete
      try {
        await fs.access(fileLocale);
        await fs.unlink(fileLocale);
      } catch (error) {
        console.warn(`Could not delete file ${fileLocale}: ${error.message}`);
        // Continue even if file doesn't exist on disk, just clear DB entry
      }

      const updatedUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          passwordHash: true,
          active: true,
        },
      });

      const newToken = await this.authService.generateToken(updatedUser);

      return { user: updatedUser, token: newToken };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao remover avatar!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateUserByAdmin(id: number, updateUserByAdminDto: UpdateUserByAdminDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });

      if (!user) {
        throw new HttpException('Usuário não encontrado!', HttpStatus.BAD_REQUEST);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: id },
        data: {
          active: updateUserByAdminDto.active,
          role: updateUserByAdminDto.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          active: true,
          role: true,
          avatar: true,
          createdAt: true,
          passwordHash: true,
        },
      });

      return updatedUser;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Falha ao atualizar usuário pelo admin!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
