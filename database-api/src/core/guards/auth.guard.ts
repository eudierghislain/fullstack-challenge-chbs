import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ErrorMessages } from 'src/core/enums/error-messages.enum';

@Injectable()
export class AuthGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) throw new UnauthorizedException(ErrorMessages.ERROR_AUTH); 

        try {
            const user = await this.validateToken(token);
            request['user'] = user;
            return true;
        } catch (error) {
            throw new UnauthorizedException(ErrorMessages.ERROR_AUTH);
        }

    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private async validateToken(token: string) {
        try {
            const response = await fetch(`http://${process.env.AUTH_HOST}:${process.env.AUTH_PORT}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new UnauthorizedException(ErrorMessages.ERROR_AUTH);

            return await response.json();
        } catch (error) {
            throw new UnauthorizedException(ErrorMessages.ERROR_AUTH);
        }
    }

}