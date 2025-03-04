import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ErrorMessages } from '../enums/error-messages.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {

    constructor(
        private usersService: UsersService,
        protected configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || Math.random().toString(36).substring(2),
        });
    }

    async validate(payload: any) {
        const user = await this.usersService.findOneById(payload.sub);
        if (!user)throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
        if (payload.tokenVersion != Number(user.tokenVersion)) throw new UnauthorizedException(ErrorMessages.SESSION_EXPIRED);
        return { sub: payload.sub, email: payload.email };
    }

}