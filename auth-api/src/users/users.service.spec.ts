import { ClientProxy } from "@nestjs/microservices";
import { UsersService } from "./users.service";
import { Test, TestingModule } from "@nestjs/testing";
import { of, throwError } from "rxjs";
import { HttpException, HttpStatus } from "@nestjs/common";
import { User } from "./model/user.model";
import { RegisterDto } from "./dto/register-user.dto";
import { ErrorMessages } from "../core/enums/error-messages.enum";

describe('UsersService', () => {
    let service: UsersService;
    let dbClient: ClientProxy;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: 'DATABASE_SERVICE',
                    useValue: {
                        send: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        dbClient = module.get<ClientProxy>('DATABASE_SERVICE');
    });

    describe('checkIfEmailExist', () => {
        it('should return true if email exists', async () => {
            jest.spyOn(dbClient, 'send').mockReturnValue(of({}));

            const result = await service.checkIfEmailExist('test@example.com');
            expect(result).toBe(true);
        });

        it('should return false if email does not exist', async () => {
            jest.spyOn(dbClient, 'send').mockReturnValue(throwError(new Error('NotFoundException')));

            const result = await service.checkIfEmailExist('test@example.com');
            expect(result).toBe(false);
        });
    });

    describe('findOneById', () => {
        it('should return a user if found', async () => {
            const user: User = { id: '1', email: 'test@example.com', password: 'hashedpass', tokenVersion: 0 } as User;
            jest.spyOn(dbClient, 'send').mockReturnValue(of(user));

            const result = await service.findOneById('1');
            expect(result).toBe(user);
        });

        it('should throw HttpException if user is not found', async () => {
            jest.spyOn(dbClient, 'send').mockReturnValue(throwError(new Error('NotFoundException')));

            await expect(service.findOneById('1')).rejects.toThrow(new HttpException(ErrorMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND));
        });
    });

    describe('findOneByEmail', () => {
        it('should return a user if found', async () => {
            const user: User = { id: '1', email: 'test@example.com', password: 'hashedpass', tokenVersion: 0 } as User;
            jest.spyOn(dbClient, 'send').mockReturnValue(of(user));

            const result = await service.findOneByEmail('test@example.com');
            expect(result).toBe(user);
        });

        it('should throw HttpException if user is not found', async () => {
            jest.spyOn(dbClient, 'send').mockReturnValue(throwError(new Error('NotFoundException')));

            await expect(service.findOneByEmail('test@example.com')).rejects.toThrow(new HttpException(ErrorMessages.USER_NOT_FOUND, HttpStatus.NOT_FOUND));
        });
    });

    describe('create', () => {
        it('should create a user successfully', async () => {
            const user: User = { id: '1', email: 'test@example.com', password: 'hashedpass', tokenVersion: 0 } as User;
            const registerDto: RegisterDto = { email: 'test@example.com', password: 'testpass', firstName: 'Test', lastName: 'User' };
            jest.spyOn(dbClient, 'send').mockReturnValue(of(user));

            const result = await service.create(registerDto);
            expect(result).toBe(user);
        });
    });
});
