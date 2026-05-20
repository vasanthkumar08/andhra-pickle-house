'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import { MagneticButton } from '../ui/MagneticButton';

export function AuthModal() {
  const { authModalOpen, closeAuthModal, pendingAdd, setUser, setCart } = useStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!authModalOpen) {
      setStep('phone');
      setPhone('');
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    const res = await api('/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (res.success) {
      setStep('otp');
      setCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    const res = await api<{ user: { id: string; phone: string; name: string | null; role: string } }>(
      '/v1/auth/otp/verify',
      { method: 'POST', body: JSON.stringify({ phone, code }) }
    );
    setLoading(false);
    if (res.success && res.data) {
      setUser(res.data.user);
      closeAuthModal();
      if (pendingAdd) {
        const cartRes = await api('/v1/cart/items', {
          method: 'POST',
          body: JSON.stringify(pendingAdd),
        });
        if (cartRes.data) setCart(cartRes.data as Parameters<typeof setCart>[0]);
      }
    } else {
      setError(res.error || 'Invalid OTP');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && next.join('').length === 6) {
      setTimeout(verifyOtp, 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeAuthModal}
          />
          <motion.div
            className="relative w-full max-w-md bg-aph-card border border-aph-gold/20 rounded-2xl p-8 shadow-2xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-3xl mb-2">Welcome Home</h2>
            <p className="text-aph-muted text-sm mb-6">
              Login with your phone to add authentic pickles to cart
            </p>

            {step === 'phone' ? (
              <>
                <label className="text-sm text-aph-muted block mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 rounded-xl bg-aph-bg border border-aph-gold/20 focus:border-aph-gold outline-none text-lg tracking-widest"
                  maxLength={10}
                />
                <MagneticButton className="w-full mt-6" onClick={requestOtp} disabled={phone.length < 10 || loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </MagneticButton>
              </>
            ) : (
              <>
                <p className="text-sm text-aph-muted mb-4">Enter 6-digit OTP sent to +91{phone}</p>
                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-14 text-center text-xl rounded-lg bg-aph-bg border border-aph-gold/30 focus:border-aph-gold outline-none"
                    />
                  ))}
                </div>
                <MagneticButton className="w-full" onClick={verifyOtp} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </MagneticButton>
                <button
                  className="w-full mt-3 text-sm text-aph-muted disabled:opacity-50"
                  disabled={cooldown > 0}
                  onClick={requestOtp}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </>
            )}

            {error && <p className="text-aph-terracotta text-sm mt-4 text-center">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
