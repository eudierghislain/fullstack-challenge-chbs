import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {

    @ApiProperty({ description: 'Refresh token of the user', required: false })
    @IsString()
    @IsOptional()
    refreshToken?: string;

    @ApiProperty({ description: 'Token version of the user', required: false })
    @IsNumber()
    @IsOptional()
    tokenVersion?: number;

}