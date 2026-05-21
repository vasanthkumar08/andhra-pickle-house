# Firebase Phone OTP Debug Checklist

Firebase phone OTP requests are sent from the browser to:

```text
identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode
```

A `400` from this endpoint means Firebase rejected the OTP request before the backend login session exists.
The `/api/v1/auth/me` and `/api/v1/cart` `401` responses are expected until login succeeds.

## Required Authorized Domains

Add these in Firebase Console > Authentication > Settings > Authorized domains.

Development:

- `localhost`
- `127.0.0.1`

Production:

- `andhra-pickle-house-web.vercel.app`
- Any custom storefront domain used in production

## Required Frontend Environment Variables

The web app fails loudly if any of these public Firebase values are missing:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

These are Firebase web config values, not Firebase Admin credentials. Do not expose service account private keys to the frontend.

## Common Firebase `400` Root Causes

- Phone provider disabled in Firebase Authentication
- Current hostname missing from Firebase Authorized domains
- Firebase SMS quota exceeded
- Billing not enabled for the Firebase project
- API key restrictions blocking the current hostname or Identity Toolkit API
- Invalid phone format sent to Firebase
- reCAPTCHA failure or stale reCAPTCHA verifier
- Ad blocker interference
- Browser privacy extensions blocking Google/Firebase/reCAPTCHA scripts

## Expected Phone Normalization

The login form accepts Indian numbers in these forms:

- `9876543210`
- `+919876543210`
- `919876543210`

All valid Indian numbers are sent to Firebase as:

```text
+91XXXXXXXXXX
```

Malformed numbers are rejected in the browser before calling Firebase.

## Browser Debugging

In development only, OTP send and verify failures log:

```text
Firebase phone OTP failed
```

with:

- `code`
- `message`
- `customData`
- `fullError`

Use the `auth/<code>` value to identify the specific Firebase setting to fix. Sensitive auth tokens are not stored in `localStorage`, and raw Firebase error logs are suppressed in production.
