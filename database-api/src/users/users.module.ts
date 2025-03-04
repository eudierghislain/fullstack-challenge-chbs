import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './model/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User])
  ],
  controllers: [UsersController],
  providers: [UserService]
})
export class UsersModule {}