import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
    @IsEmail()
    @IsDefined()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'The password of the user', minLength: 8 })
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John', description: 'The first name of the user' })
    @IsDefined()
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
    @IsDefined()
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 0, description: 'The token version of the user' })
    @IsNumber()
    @IsOptional()
    tokenVersion?: number = 0;
}