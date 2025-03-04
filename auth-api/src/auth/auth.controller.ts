import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from '../users/dto/register-user.dto';
import { LoginDto } from '../users/dto/login-user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';
import { Tokens } from '../core/interfaces/tokens.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService
    ) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth() 
    @Get('profile')
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({ status: 200, description: 'The found record', type: Object })
    public getProfile(
        @Req() req: Request
    ): Express.User | undefined {
        return req.user;
    }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 201, description: 'The user has been successfully logged in.', type: Tokens })
    public login(
        @Body() loginDto: LoginDto
    ): Promise<Tokens> {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register user' })
    @ApiResponse({ status: 201, description: 'The user has been successfully registered.', type: Tokens })
    public register(
        @Body() registerDto: RegisterDto
    ): Promise<Tokens> {
        return this.authService.register(registerDto);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh tokens' })
    @ApiResponse({ status: 201, description: 'The tokens have been successfully refreshed.', type: Tokens })
    public refreshTokens(
        @Body() body: { userId: string; refreshToken: string }
    ): Promise<Tokens> {
        return this.authService.refreshTokens(body.userId, body.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'The user has been successfully logged out.' })
    public logout(
        @Req() req: Request
    ) {
        const userId = req.user?.['sub'];
        return this.authService.logout(userId);
    }

}