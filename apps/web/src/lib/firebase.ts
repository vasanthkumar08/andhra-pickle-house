'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

export const REQUIRED_FIREBASE_PUBLIC_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

export const REQUIRED_FIREBASE_AUTHORIZED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'andhra-pickle-house-web.vercel.app',
] as const;

export class FirebasePublicConfigError extends Error {
  constructor(readonly missingVars: string[]) {
    super(`Missing required Firebase public env vars: ${missingVars.join(', ')}`);
    this.name = 'FirebasePublicConfigError';
  }
}

let domainWarningShown = false;

function readPublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new FirebasePublicConfigError([name]);
  }
  return value;
}

export function validateFirebasePublicConfig(): void {
  const missingVars = REQUIRED_FIREBASE_PUBLIC_ENV.filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    throw new FirebasePublicConfigError([...missingVars]);
  }
}

export function warnIfFirebaseDomainMayBeUnauthorized(hostname = globalThis.location?.hostname): void {
  if (process.env.NODE_ENV === 'production' || domainWarningShown || !hostname) return;

  const isVercelPreview = hostname.endsWith('.vercel.app');
  const isKnownDomain = REQUIRED_FIREBASE_AUTHORIZED_DOMAINS.includes(
    hostname as (typeof REQUIRED_FIREBASE_AUTHORIZED_DOMAINS)[number]
  );

  if (!isKnownDomain && !isVercelPreview) {
    domainWarningShown = true;
    console.warn('Firebase phone auth domain may be unauthorized', {
      hostname,
      requiredAuthorizedDomains: REQUIRED_FIREBASE_AUTHORIZED_DOMAINS,
      note: 'Add this hostname in Firebase Console > Authentication > Settings > Authorized domains.',
    });
  }
}

function getFirebaseConfig() {
  validateFirebasePublicConfig();

  return {
    apiKey: readPublicEnv('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: readPublicEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: readPublicEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: readPublicEnv(
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ),
    messagingSenderId: readPublicEnv(
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: readPublicEnv('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());
  auth.languageCode = 'en';
  return auth;
}
