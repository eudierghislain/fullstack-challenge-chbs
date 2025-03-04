import { ApiProperty } from '@nestjs/swagger';

export class Tokens {
    @ApiProperty({ description: 'Access JWT token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken: string;

    @ApiProperty({ description: 'Refresh JWT token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refreshToken: string;
}
