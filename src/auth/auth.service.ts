import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private emailService: EmailService,
  ) {}

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const customResetLink =
        await this.firebaseService.generateCustomResetLink(email);

      await this.emailService.sendPasswordResetEmail(email, customResetLink);

      return {
        message:
          'If an account exists for this email, a password reset link has been sent.',
      };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/invalid-email'
      ) {
        return {
          message:
            'If an account exists for this email, a password reset link has been sent.',
        };
      }
      throw error;
    }
  }
}
