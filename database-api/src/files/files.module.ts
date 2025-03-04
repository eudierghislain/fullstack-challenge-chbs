import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File } from './model/file.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forFeature([File])
  ],
  providers: [FilesService],
  controllers: [FilesController]
})
export class FilesModule { }
