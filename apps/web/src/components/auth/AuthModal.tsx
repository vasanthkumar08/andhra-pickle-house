'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import { MagneticButton } from '../ui/MagneticButton';

type AuthStep = 'phone' | 'otp' | 'success';
type NormalizedPhone = { ok: true; value: string } | { ok: false; error: string };

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
const EMPTY_OTP = Array.from({ length: OTP_LENGTH }, () => '');
const AUTH_ERROR_ID = 'auth-error';

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizePhoneForBackend(rawPhone: string, countryCode: string): NormalizedPhone {
  const digits = normalizeDigits(rawPhone);

  if (countryCode === '+91') {
    const nationalNumber = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

    if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
      return { ok: false, error: 'Enter a valid 10-digit Indian mobile number.' };
    }

    return { ok: true, value: `+91${nationalNumber}` };
  }

  if (digits.length < 6 || digits.length > 14) {
    return { ok: false, error: 'Enter a valid mobile number.' };
  }

  const dialCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return { ok: true, value: `${dialCode}${digits}` };
}

export function AuthModal() {
  const { authModalOpen, closeAuthModal, pendingAdd, setUser, setCart } = useStore();
  const [step, setStep] = useState<AuthStep>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const sendInFlightRef = useRef(false);
  const verifyInFlightRef = useRef(false);

  const normalizedPhone = useMemo(() => normalizePhoneForBackend(phone, countryCode), [countryCode, phone]);
  const e164Phone = normalizedPhone.ok ? normalizedPhone.value : '';

  const phoneReady = normalizedPhone.ok;
  const otpCode = otp.join('');
  const otpReady = otpCode.length === OTP_LENGTH;
  const busy = loading || sendInFlightRef.current || verifyInFlightRef.current;

  useEffect(() => {
    if (!authModalOpen) {
      setStep('phone');
      setPhone('');
      setOtp([...EMPTY_OTP]);
      setError('');
      setCooldown(0);
      sendInFlightRef.current = false;
      verifyInFlightRef.current = false;
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => phoneInputRef.current?.focus(), 100);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        closeAuthModal();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [authModalOpen, closeAuthModal, loading]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerifiedSession = async (verifiedPhone: string, code: string) => {
    const res = await api<{ user: { id: string; phone: string; name: string | null; role: string } }>(
      '/v1/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone: verifiedPhone, code }),
      }
    );

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Backend login failed after phone verification.');
    }

    setUser(res.data.user);
    setStep('success');

    if (pendingAdd) {
      const cartRes = await api('/v1/cart/items', {
        method: 'POST',
        body: JSON.stringify(pendingAdd),
      });
      if (cartRes.data) setCart(cartRes.data as Parameters<typeof setCart>[0]);
    }

    window.setTimeout(closeAuthModal, 500);
  };

  const sendOtp = async () => {
    if (sendInFlightRef.current || loading || cooldown > 0) return;
    if (!normalizedPhone.ok) {
      setError(normalizedPhone.error);
      return;
    }

    sendInFlightRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await api<{ expiresIn: number }>('/v1/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone: normalizedPhone.value }),
      });

      if (!res.success) {
        throw new Error(res.error || 'Unable to send OTP right now.');
      }

      setStep('otp');
      setOtp([...EMPTY_OTP]);
      setCooldown(RESEND_SECONDS);
      window.setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send OTP right now.');
    } finally {
      sendInFlightRef.current = false;
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (verifyInFlightRef.current || !normalizedPhone.ok || !otpReady || loading) return;

    verifyInFlightRef.current = true;
    setLoading(true);
    setError('');

    try {
      await handleVerifiedSession(normalizedPhone.value, otpCode);
    } catch (verifyError) {
      setOtp([...EMPTY_OTP]);
      inputRefs.current[0]?.focus();
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP right now.');
    } finally {
      verifyInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = normalizeDigits(value).slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');

    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'Enter') {
      void verifyOtp();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = normalizeDigits(event.clipboardData.getData('text')).slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const next = [...EMPTY_OTP];
    for (let index = 0; index < pasted.length; index += 1) {
      next[index] = pasted[index] ?? '';
    }
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          aria-describedby={error ? AUTH_ERROR_ID : undefined}
          aria-busy={busy}
        >
          <motion.button
            type="button"
            aria-label="Close login"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            disabled={loading}
            onClick={loading ? undefined : closeAuthModal}
          />

          <motion.div
            ref={modalRef}
            className="relative w-full max-w-md overflow-hidden rounded-t-[28px] border border-aph-gold/20 bg-aph-card/95 p-6 shadow-2xl backdrop-blur-xl sm:rounded-[28px] sm:p-8"
            initial={{ y: 120, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 120, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aph-gold via-aph-terracotta to-aph-mango" />

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-aph-gold">Secure Phone Login</p>
              <h2 id="auth-title" className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight">
                Welcome Home
              </h2>
              <p className="mt-2 text-sm leading-6 text-aph-muted">
                Verify your mobile number to continue with cart, wishlist, and orders.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                >
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-aph-muted">
                    Mobile number
                  </label>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <select
                      aria-label="Country code"
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="h-12 rounded-xl border border-aph-gold/20 bg-aph-bg px-3 text-base outline-none focus:border-aph-gold"
                      disabled={loading}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(event) => setPhone(normalizeDigits(event.target.value).slice(0, 14))}
                      placeholder="9876543210"
                      ref={phoneInputRef}
                      aria-invalid={phone ? !phoneReady : undefined}
                      aria-describedby={error ? AUTH_ERROR_ID : undefined}
                      className="h-12 w-full rounded-xl border border-aph-gold/20 bg-aph-bg px-4 text-lg tracking-wide outline-none focus:border-aph-gold"
                      disabled={loading}
                    />
                  </div>
                  <MagneticButton className="mt-6 w-full" onClick={sendOtp} disabled={!phoneReady || loading || cooldown > 0}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </MagneticButton>
                  {phone && !phoneReady && (
                    <p className="mt-3 text-center text-xs text-aph-muted" role="status">
                      Enter a valid {countryCode === '+91' ? '10-digit Indian mobile number' : 'mobile number'}.
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                >
                  <p className="mb-4 text-sm text-aph-muted">
                    Enter the 6-digit code sent to <span className="font-semibold text-aph-ink">{e164Phone}</span>
                  </p>
                  <div className="mb-6 grid grid-cols-6 gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          inputRefs.current[index] = element;
                        }}
                        aria-label={`OTP digit ${index + 1}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? AUTH_ERROR_ID : undefined}
                        onChange={(event) => handleOtpChange(index, event.target.value)}
                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                        onPaste={handleOtpPaste}
                        className="aspect-square min-h-12 rounded-xl border border-aph-gold/30 bg-aph-bg text-center text-xl font-semibold outline-none transition focus:border-aph-gold focus:ring-2 focus:ring-aph-gold/20"
                        disabled={loading}
                      />
                    ))}
                  </div>
                  <MagneticButton className="w-full" onClick={verifyOtp} disabled={!otpReady || loading}>
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </MagneticButton>
                  <button
                    type="button"
                    className="mt-4 w-full text-sm font-medium text-aph-muted transition hover:text-aph-gold disabled:opacity-50"
                    disabled={cooldown > 0 || loading}
                    onClick={sendOtp}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-aph-gold/15 text-2xl text-aph-gold">
                    ✓
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-2xl">You are signed in</p>
                  <p className="mt-2 text-sm text-aph-muted">Taking you back to your pickles.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                id={AUTH_ERROR_ID}
                role="alert"
                className="mt-4 rounded-xl border border-aph-terracotta/20 bg-aph-terracotta/10 px-4 py-3 text-center text-sm text-aph-terracotta"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
