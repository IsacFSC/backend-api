import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserByAdminDto } from './dto/update-user-by-admin.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guard/auth-token.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/common/role.enum';
import { ActiveUser } from 'src/auth/param/active-user.decorator';
import { User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

// > Buscar os detalhes de um usuarios
// > cadastrar usuario
// > Deletar usuario
@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Get('/All')
  findAllUsers(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('active') active?: string,
    @Query('role') role?: string,
  ) {
    return this.userService.findAll(paginationDto, search, active, role);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOneUser(@Param('id', ParseIntPipe) id: number) {
    console.log('Token teste: ', process.env.TOKEN_KEY);
    return this.userService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: User,
  ) {
    return this.userService.update(id, updateUserDto, user);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/:id')
  updateUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserByAdminDto: UpdateUserByAdminDto,
  ) {
    return this.userService.updateUserByAdmin(id, updateUserByAdminDto);
  }

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @Delete('avatar')
  async removeAvatar(@ActiveUser() user: User) {
    return this.userService.removeAvatarImage(user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id', ParseIntPipe) id: number, @ActiveUser() user: User) {
    return this.userService.delete(id, user);
  }

  @Roles(Role.ADMIN, Role.LEADER, Role.USER)
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async uploadAvatar(
    @ActiveUser() user: User,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /jpeg|png|jpg/g,
        })
        .addMaxSizeValidator({
          maxSize: 1 * (1024 * 1024),
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatarImage(user, file);
  }
}
