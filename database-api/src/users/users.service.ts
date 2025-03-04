import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './model/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RpcException } from '@nestjs/microservices';
import { ErrorMessages } from '../core/enums/error-messages.enum';

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User)
        private userModel: typeof User,
    ) { }

    public async findAll(): Promise<User[]> {
        return this.userModel.findAll();
    }

    public async findByEmail(email: string): Promise<User> {
        const user = await this.userModel.findOne({ where: { email } });
        if (!user) {
            throw new RpcException({
                status: HttpStatus.NOT_FOUND,
                message: ErrorMessages.USER_NOT_FOUND
            });
        }
        return user;
    }

    public async findOne(id: string): Promise<User> {
        const user = await this.userModel.findByPk(id);
        if (!user) {
            throw new RpcException({
                status: HttpStatus.NOT_FOUND,
                message: ErrorMessages.USER_NOT_FOUND
            });
        }
        return user;
    }

    public async create(createUserDto: CreateUserDto): Promise<User> {
        const user = await this.userModel.create({ ...createUserDto });
        if (!user) {
            throw new RpcException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: ErrorMessages.UNABLE_TO_CREATE_USER
            });
        }
        return user;
    }

    public async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);
        const userUpdated = await user.update(updateUserDto);
        if (!userUpdated) { 
            throw new RpcException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: ErrorMessages.UNABLE_TO_UPDATE
            });
        }
        return user;
    }

    public async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        if (!user) {
            throw new RpcException({
                status: HttpStatus.NOT_FOUND,
                message: ErrorMessages.USER_NOT_FOUND
            });
        }
        await user.destroy();
    }

}