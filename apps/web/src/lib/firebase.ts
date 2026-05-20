'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

function readPublicEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required Firebase public env var: ${name}`);
  }
  return value;
}

function getFirebaseConfig() {
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
