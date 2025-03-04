import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { User } from './model/user.model';
import { RegisterDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorMessages } from '../core/enums/error-messages.enum';
import { TCPMessages } from '../core/enums/tcp-message.enum';

@Injectable()
export class UsersService {

    constructor(
        @Inject('DATABASE_SERVICE') private readonly dbClient: ClientProxy,
    ) { }

    public async checkIfEmailExist(email: string): Promise<boolean> {
        try {
            await firstValueFrom(this.dbClient.send(TCPMessages.FIND_USER_BY_EMAIL, email));
            return true;
        } catch (NotFoundException) {
            console.log(NotFoundException)
            return false
        }
    }

    public async findOneById(id: string): Promise<User> {
        try {
            return await firstValueFrom(this.dbClient.send(TCPMessages.FIND_USER_BY_ID, id));
        } catch (NotFoundException) {
            console.log(NotFoundException)
            throw new HttpException(ErrorMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
    }

    public async findOneByEmail(email: string): Promise<User> {
        try {
            return await firstValueFrom(this.dbClient.send(TCPMessages.FIND_USER_BY_EMAIL, email));
        } catch (NotFoundException) {
            console.log(NotFoundException)
            throw new HttpException(ErrorMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
    }

    public async create(user: RegisterDto): Promise<User> {
        try {
            return await firstValueFrom(this.dbClient.send(TCPMessages.CREATE_USER, user));
        } catch (CreateException) {
            console.log(CreateException)
            throw new HttpException(ErrorMessages.UNABLE_TO_CREATE_USER, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async update(id: string, user: UpdateUserDto): Promise<User> {
        try {
            return await firstValueFrom(this.dbClient.send(TCPMessages.UPDATE_USER, { id, user }));
        } catch(UpdateException) {
            console.log(UpdateException)
            throw new HttpException(ErrorMessages.UNABLE_TO_UPDATE, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}