import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      console.log('Invalid authorization format. Expected "Bearer <token>".');
      return false;
    }

    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      //req.user = decodedToken; // attach decoded user info to request

      // get user from DB (with role and scope info)
      const user = await this.usersService.findOneUid(decodedToken.uid);
      if (!user) throw new UnauthorizedException('User not found');

      // attach enriched user to request
      req.user = {
        id: user.id,
        role: user.role,
        companyId: user.companyId,
      };

      return true;
    } catch (error) {
        if (error.code === 'auth/id-token-expired') {
            console.error('Token has expired.');
            throw new UnauthorizedException('Token has expired.');
        } else if (error.code === 'auth/invalid-id-token') {
            console.error('Invalid ID token provided.');
            throw new UnauthorizedException('Invalid ID token provided.');
        } else {
            console.error('Error verifying token:', error);
            throw new UnauthorizedException('Error verifying token:', error);
        }
    }
  }
}
