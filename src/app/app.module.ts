import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { LoggerMiddleware } from 'src/common/middlewares/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { MessagingModule } from 'src/messaging/messaging.module';
// import { APP_GUARD } from '@nestjs/core';
// import { AuthAdminGuard } from 'src/common/guards/admin.guard';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TasksModule,
    UsersModule,
    SchedulesModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'files'),
      serveRoot: '/files',
      serveStaticOptions: {
        index: false,
        setHeaders: (res) => {
          res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        },
      },
    }),
    MessagingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthAdminGuard, // parei na aula 38 minuto 6:10
    // },
  ],
})
export class AppModule implements NestModule {
  constructor() {
    const resolvedRootPath = join(__dirname, '..', '..', 'files');
    console.log(`ServeStaticModule rootPath: ${resolvedRootPath}`);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}