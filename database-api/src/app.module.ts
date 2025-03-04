import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './core/database.config';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    SequelizeModule.forRoot(databaseConfig),
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.DB_HOST,
          port: Number(process.env.TCP_PORT_AUTH),
        }
      }
    ]),
    ClientsModule.register([
      {
        name: 'FILES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.DB_HOST,
          port: Number(process.env.TCP_PORT_FILES),
        }
      }
    ]),
    UsersModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
