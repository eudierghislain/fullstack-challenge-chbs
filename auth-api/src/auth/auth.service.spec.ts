import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login-user.dto';
import { Tokens } from '../core/interfaces/tokens.interface';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/model/user.model';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {

    let authService: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findOneByEmail: jest.fn(),
                        findOneById: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        checkIfEmailExist: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn(),
                        verifyAsync: jest.fn(),
                        decode: jest.fn(),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });


    it('should login user and return tokens', async () => {
        const loginDto: LoginDto = { email: 'user@example.com', password: 'testpass' };
        const user: User = { id: '1', email: 'user@example.com', password: 'hashedpass', tokenVersion: 0 } as User;
        const tokens: Tokens = { accessToken: 'access', refreshToken: 'refresh' };

        jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(authService, 'getTokensFor').mockResolvedValue(tokens);
        jest.spyOn(authService, 'updateRefreshToken').mockResolvedValue();

        const result = await authService.login(loginDto);
        expect(result).toBe(tokens);
    });

    it('should register a new user and return tokens', async () => {
        const registerDto = { email: 'newuser@example.com', password: 'newpass', firstName: 'John', lastName: 'Doe' };
        const user: User = { id: '2', email: 'newuser@example.com', password: 'hashedpass', tokenVersion: 0 } as User;
        const tokens: Tokens = { accessToken: 'access', refreshToken: 'refresh' };

        jest.spyOn(usersService, 'checkIfEmailExist').mockResolvedValue(false);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpass');
        jest.spyOn(usersService, 'create').mockResolvedValue(user);
        jest.spyOn(authService, 'getTokensFor').mockResolvedValue(tokens);
        jest.spyOn(authService, 'updateRefreshToken').mockResolvedValue();

        const result = await authService.register(registerDto);
        expect(result).toBe(tokens);
    });

    it('should logout a user successfully', async () => {
        const userId = '1';
        const userUpdated = { id: '1', email: 'user@example.com', password: 'hashedpass', tokenVersion: 0 } as User;

        jest.spyOn(usersService, 'update').mockResolvedValue(userUpdated);

        const result = await authService.logout(userId);
        expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should refresh tokens successfully', async () => {
        const userId = '1';
        const refreshToken = 'validRefreshToken';
        const user: User = { id: '1', email: 'user@example.com', password: 'hashedpass', tokenVersion: 0, refreshToken: 'hashedRefreshToken' } as User;
        const tokens: Tokens = { accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' };

        jest.spyOn(usersService, 'findOneById').mockResolvedValue(user);
        jest.spyOn(authService.jwtService, 'decode').mockReturnValue({ tokenVersion: 0 });
        jest.spyOn(authService.jwtService, 'verifyAsync').mockResolvedValue({});
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
        jest.spyOn(authService, 'getTokensFor').mockResolvedValue(tokens);
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedNewRefreshToken');
        jest.spyOn(usersService, 'update').mockResolvedValue(user);

        const result = await authService.refreshTokens(userId, refreshToken);
        expect(result).toBe(tokens);
    });

    it('should revoke all tokens for a user', async () => {
        const userId = '1';
        const user: User = { id: '1', email: 'user@example.com', password: 'hashedpass', tokenVersion: 0 } as User;

        jest.spyOn(usersService, 'findOneById').mockResolvedValue(user);
        jest.spyOn(usersService, 'update').mockResolvedValue(user);

        await authService.revokeAllTokens(userId);
        expect(usersService.update).toHaveBeenCalledWith(userId, {
            refreshToken: undefined,
            tokenVersion: 1,
        });
    });

});



