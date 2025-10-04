import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from './users.service';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';

/*
 Teste unitário
 Teste de ponta a ponta 2e2
> AAA
 > Configuração do test - Arrange
 > Algo que deseja fazer ação - Act
 > Conferir se a ação foi esperada - Assert
*/
describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: HashingServiceProtocol,
          useValue: {},
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);
  });
  it('should be defined users service', () => {
    expect(usersService).toBeDefined();
  });
});
// continuar na aula *TESTES AUTOMATIZADOS*
// corrigir minitu 8:25 da aula 63
