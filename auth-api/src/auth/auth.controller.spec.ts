import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegisterDto } from '../users/dto/register-user.dto';
import { LoginDto } from '../users/dto/login-user.dto';
import { Tokens } from '../core/interfaces/tokens.interface';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
    let authController: AuthController;
    let authService: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        login: jest.fn(),
                        register: jest.fn(),
                        refreshTokens: jest.fn(),
                        logout: jest.fn(),
                    }
                },
                {
                    provide: JwtAuthGuard,
                    useValue: {
                        canActivate: jest.fn((context: ExecutionContext) => true),
                    },
                },
                Reflector,
            ],
        }).compile();

        authController = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    describe('getProfile', () => {
        it('should return user profile', () => {
            const req = { user: { id: '1', username: 'testuser' } } as any;
            expect(authController.getProfile(req)).toEqual(req.user);
        });
    });

    describe('login', () => {
        it('should login user and return tokens', async () => {
            const loginDto: LoginDto = { email: 'user@example.com', password: 'testpass' };
            const tokens: Tokens = { accessToken: 'access', refreshToken: 'refresh' };
            jest.spyOn(authService, 'login').mockResolvedValue(tokens);

            expect(await authController.login(loginDto)).toBe(tokens);
        });
    });

    describe('register', () => {
        it('should register user and return tokens', async () => {
            const registerDto: RegisterDto = { email: 'user@example.com', password: 'testpass', firstName: 'John' , lastName : 'Doe' }
            const tokens: Tokens = { accessToken: 'access', refreshToken: 'refresh' };
            jest.spyOn(authService, 'register').mockResolvedValue(tokens);

            expect(await authController.register(registerDto)).toBe(tokens);
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens', async () => {
            const body = { userId: '1', refreshToken: 'refresh' };
            const tokens: Tokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
            jest.spyOn(authService, 'refreshTokens').mockResolvedValue(tokens);

            expect(await authController.refreshTokens(body)).toBe(tokens);
        });
    });

    describe('logout', () => {
        it('should logout user', async () => {
            const req = { user: { sub: '1' } } as any;
            jest.spyOn(authService, 'logout').mockResolvedValue({ message: 'Logout successful' });

            expect(await authController.logout(req)).not.toBeNull();
        });
    });
});