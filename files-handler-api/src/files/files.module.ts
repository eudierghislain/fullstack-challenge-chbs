import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from 'src/pdf/pdf.service';
import { UsersService } from 'src/users/users.service';


@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'DATABASE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.DB_HOST,
          port: Number(process.env.TCP_PORT_DB),
        }
      }
    ]),
  ],
  providers: [
    FilesService,
    PdfService,
    UsersService
  ],
  controllers: [FilesController]
})
export class FilesModule { }
