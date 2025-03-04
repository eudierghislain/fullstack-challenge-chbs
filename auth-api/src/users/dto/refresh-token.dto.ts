import { IsDefined, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {

    @ApiProperty({
        description: 'The ID of the user',
        example: '12345'
    })
    @IsString()
    @IsDefined()
    userId: string;

    @ApiProperty({
        description: 'The refresh token',
        example: 'some-refresh-token'
    })
    @IsString()
    @IsDefined()
    refreshToken: string;
    
}