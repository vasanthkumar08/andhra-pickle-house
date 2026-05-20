import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { env } from '../config/env';
import { UnauthorizedError } from './errors';

let firebaseApp: App | null = null;

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function getFirebaseApp(): App {
  if (firebaseApp) return firebaseApp;

  const [existing] = getApps();
  if (existing) {
    firebaseApp = existing;
    return firebaseApp;
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY ?? ''),
    }),
  });

  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export async function verifyFirebasePhoneToken(firebaseToken: string): Promise<DecodedIdToken> {
  try {
    return await getFirebaseAuth().verifyIdToken(firebaseToken, true);
  } catch {
    throw new UnauthorizedError('Invalid or expired Firebase token');
  }
}
