import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../users/dto/register-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../users/dto/login-user.dto';
import { Tokens } from '../core/interfaces/tokens.interface';
import { User } from '../users/model/user.model';
import { ErrorMessages } from '../core/enums/error-messages.enum';

@Injectable()
export class AuthService {

    constructor(
        private readonly usersService: UsersService,
        public readonly jwtService: JwtService,
    ) { }

    public async login(loginDto: LoginDto): Promise<Tokens> {
        const { email, password } = loginDto;

        const user = await this.usersService.findOneByEmail(email);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);

        const tokens = await this.getTokensFor(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    public async logout(userId: string) {
        const userUpdated = await this.usersService.update(userId, { refreshToken: undefined, tokenVersion: 0 });
        if (userUpdated.tokenVersion === 0) {
            return { message: 'Logout successful' };
        } else {
            throw new UnauthorizedException(ErrorMessages.UNABLE_TO_LOGOUT);
        }
       
    }

    public async register(registerDto: RegisterDto): Promise<Tokens> {

        const { email, password } = registerDto;

        const emailExist: boolean = await this.usersService.checkIfEmailExist(email);
        if (emailExist)  throw new BadRequestException(ErrorMessages.USER_ALREADY_EXISTS);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.usersService.create({ ...registerDto, password: hashedPassword });
        const tokens = await this.getTokensFor(user);

        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }


    public async refreshTokens(id: string, refreshToken: string) : Promise<Tokens> {
        const user = await this.usersService.findOneById(id);
        if (!user || !user.refreshToken) throw new UnauthorizedException(ErrorMessages.FORBIDDEN);

        try {
            const decoded = this.jwtService.decode(refreshToken);

            if (decoded.tokenVersion != user.tokenVersion) throw new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_EXPIRED);

            await this.jwtService.verifyAsync(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET
            });

            const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!refreshTokenMatches) throw new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_INVALID);

            const newTokenVersion = Number(user.tokenVersion) + 1;
            const tokens = await this.getTokensFor(user,newTokenVersion);

            const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
            await this.usersService.update(user.id, {
                refreshToken: hashedRefreshToken,
                tokenVersion: newTokenVersion,
            });

            return tokens;
        } catch (error) {
            await this.revokeAllTokens(user.id);
            throw error;
        }
    }

    public async revokeAllTokens(userId: string): Promise<void> {
        const user = await this.usersService.findOneById(userId);
        if (!user) return;

        const newTokenVersion = (Number(user.tokenVersion) || 0) + 1;
        await this.usersService.update(userId, {
            refreshToken: undefined,
            tokenVersion: newTokenVersion,
        });
    }

    public async updateRefreshToken(userId: string, refreshToken: string) : Promise<void> {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(userId, {
            refreshToken: hashedRefreshToken,
        });
    }

    public async getTokensFor(user: User, newTokenVersion?: number): Promise<Tokens> {
        const [accessToken, refreshToken] = await Promise.all([

            this.jwtService.signAsync(
                {
                    sub: user.id,
                    email : user.email,
                    tokenVersion : newTokenVersion ?? user.tokenVersion
                },
                {
                    secret: process.env.JWT_SECRET,
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: user.id,
                    email: user.email,
                    tokenVersion: newTokenVersion ?? user.tokenVersion
                },
                {
                    secret: process.env.JWT_REFRESH_SECRET,
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

}
