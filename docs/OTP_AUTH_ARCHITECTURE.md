# OTP Authentication Architecture

## Current flow

1. The auth modal normalizes the phone number to E.164.
2. The frontend posts to `/v1/auth/otp/request`.
3. The API validates input and calls `authService.requestOtp`.
4. `OtpService` rate-limits requests, generates a six-digit OTP, hashes it with bcrypt, stores it in Prisma with expiry and attempt limits, then asks the notification provider to send it.
5. With `OTP_PROVIDER=twilio`, `TwilioProvider` sends SMS through Twilio.
6. The user enters the OTP and the frontend posts to `/v1/auth/otp/verify`.
7. `OtpService` verifies the latest unused, unexpired OTP, increments attempts atomically, marks the OTP as used, and returns the normalized phone.
8. The auth service creates the user/session, rotates refresh state, and the controller sets HttpOnly cookies.

## Firebase Phone Auth status

Firebase Phone Authentication is not part of the active login flow. The app
should not render reCAPTCHA, call `signInWithPhoneNumber`, keep a
`confirmationResult`, or exchange Firebase ID tokens for login. Those pieces
create a second authority for authentication and add billing, domain, and
reCAPTCHA lifecycle failure modes.

## Twilio requirements

Set these on the backend environment:

```bash
AUTH_PROVIDER=legacy
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
```

If a Messaging Service is not used, set `TWILIO_FROM_PHONE` to a Twilio-owned
SMS-capable phone number instead. The account SID and auth token alone cannot
send SMS.

## Root-cause checklist for OTP failures

- Frontend is pointing at the wrong API URL, especially Vercel falling back to localhost.
- API deployment still has stale `AUTH_PROVIDER=firebase`.
- `OTP_PROVIDER` is `console` in production.
- Missing `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN`.
- Missing `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_PHONE`.
- Twilio sender is not SMS-capable for the destination country.
- Trial Twilio account has not verified the destination number.
- Phone number is not normalized to E.164.
- Redis or fallback rate limit blocks repeated sends.
- OTP expired, was already used, or exceeded max attempts.
