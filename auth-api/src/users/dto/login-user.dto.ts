import { IsDefined, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'User email address', example: 'user@example.com' })
    @IsDefined()
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'User password', example: 'password123' })
    @IsDefined()
    @IsNotEmpty()
    password: string;
}