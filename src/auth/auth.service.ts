import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {
    console.log(jwtConfiguration);
  }

  async generateToken(user: User): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.jwtTtl,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      },
    );
  }

  async authenticate(signInDto: SignInDto) {
    // validar email
    const user = await this.prisma.user.findFirst({
      where: {
        email: signInDto.email,
        active: true, // Verifica se o usuário está ativo
      },
    });

    if (!user) {
      throw new HttpException('Falha ao fazer Login', HttpStatus.UNAUTHORIZED);
    }
    // validar senha
    const passwordIsValid = await this.hashingService.compare(
      signInDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new HttpException(
        'Email ou senha inválido!',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const token = await this.generateToken(user);
    console.log(user);
    console.log('logado com sucesso');
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }
}
