import { MessagePattern } from '@nestjs/microservices';
import { Controller, Get, Param, Delete, HttpCode } from '@nestjs/common';
import { UserService } from './users.service';
import { User } from './model/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TCPMessages } from 'src/core/enums/tcp-message.enum';

@Controller('users')
export class UsersController {

    constructor(
        private readonly userService: UserService
    ) { }

    @MessagePattern(TCPMessages.FIND_USER_BY_ID)
    public findOneById(id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @MessagePattern(TCPMessages.FIND_USER_BY_EMAIL)
    public findOneByEmail(email: string): Promise<User> {
        console.log('ici')
        return this.userService.findByEmail(email);
    }

    @MessagePattern(TCPMessages.CREATE_USER)
    public create(
        createUserDto: CreateUserDto
    ): Promise<User> {
        return this.userService.create(createUserDto);
    }

    @MessagePattern(TCPMessages.UPDATE_USER)
    public update(
        payload : { id: string, user: UpdateUserDto }
    ): Promise<User> {
        return this.userService.update(payload.id, payload.user);
    }


    @Get()
    public findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    public findOne(
        @Param('id') id: string
    ): Promise<User> {
        return this.userService.findOne(id);
    }

    @Delete(':id')
    @HttpCode(204)
    public remove(
        @Param('id') id: string
    ): Promise<void> {
        return this.userService.remove(id);
    }

}
