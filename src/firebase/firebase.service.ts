import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

//const serviceAccount = require('../../relief-pharmacist-service-account.json');

@Injectable()
export class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(), //Initialize works for local and google cloud run
      });

      //Initialize using service-account.json file
      // credential: admin.credential.cert(
      //     serviceAccount as admin.ServiceAccount
      //   ),
    }
  }

  // export class FirebaseService {
  //   constructor() {
  //     if (!admin.apps.length) {
  //       admin.initializeApp({
  //         credential: admin.credential.cert({
  //           projectId: process.env.FIREBASE_PROJECT_ID,
  //           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //           privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //         }),
  //         storageBucket: process.env.GCLOUD_STORAGE_BUCKET,
  //       });
  //     }
  //   }

  async verifyToken(token: string) {
    return admin.auth().verifyIdToken(token);
  }

  async createFirebaseUser(email: string, password: string) {
    return admin.auth().createUser({
      email: email,
      password: password,
    });
  }

  async deleteFirebaseUser(uid: string) {
    return admin.auth().deleteUser(uid);
  }

  async generatePasswordResetLink(email: string): Promise<string> {
    const actionCodeSettings = {
      url: `${process.env.FRONTEND_URL}/reset_password`,
      handleCodeInApp: true,
    };
    return admin.auth().generatePasswordResetLink(email, actionCodeSettings);
  }

  async generateCustomResetLink(email: string): Promise<string> {
    const firebaseLink = await this.generatePasswordResetLink(email);

    const urlParams = new URL(firebaseLink).searchParams;
    const oobCode = urlParams.get('oobCode');

    const customResetLink = `${process.env.FRONTEND_URL}/reset_password?oobCode=${oobCode}`;

    return customResetLink;
  }
}
