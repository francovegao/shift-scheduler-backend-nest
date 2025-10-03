import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

const serviceAccount = require('../../relief-pharmacist-service-account.json');

@Injectable()
export class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount
        ),
      });
    }
  }

  async verifyToken(token: string) {
    return admin.auth().verifyIdToken(token);
  }

  async createFirebaseUser(email: string, password: string){
    return admin.auth().createUser({
      email: email,
      password: password,
    });
  }

  async deleteFirebaseUser(uid: string) {
    return admin.auth().deleteUser(uid);
  }
}
