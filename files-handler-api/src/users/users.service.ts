import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ErrorMessages } from '../core/enums/error-messages.enum';
import { TCPMessages } from '../core/enums/tcp-message.enum';
import { User } from 'src/core/interfaces/user.interface';

@Injectable()
export class UsersService {

    constructor(
        @Inject('DATABASE_SERVICE') private readonly dbClient: ClientProxy,
    ) { }

    public async findOneById(id: string): Promise<User> {
        try {
            return await firstValueFrom(this.dbClient.send(TCPMessages.FIND_USER_BY_ID, id));
        } catch (NotFoundException) {
            console.log(NotFoundException)
            throw new HttpException(ErrorMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
    }

}