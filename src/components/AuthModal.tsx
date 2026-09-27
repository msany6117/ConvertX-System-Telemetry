import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: 'free' | 'pro' | 'business';
  mode?: 'login' | 'upgrade';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = 'pro',
  mode = 'login',
}) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [currentMode, setCurrentMode] = useState<'login' | 'upgrade'>(mode);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail('');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentMode === 'upgrade' ? 'Pro Access Activated!' : 'Sign-in Link Dispatched'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {currentMode === 'upgrade'
                ? 'Welcome to ConvertX Pro. Enjoy 2 GB uploads, priority queues, and unlimited AI conversions.'
                : `We've sent a magic authentication link to ${email}. Check your inbox to continue.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{currentMode === 'upgrade' ? 'ConvertX Pro Account' : 'ConvertX Account'}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentMode === 'upgrade' ? 'Upgrade to ConvertX Pro' : 'Welcome back'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {currentMode === 'upgrade'
                  ? 'Unlock 2 GB files, unlimited batch conversions, and high-speed cloud clusters.'
                  : 'Enter your email to sign in or access your converted files history.'}
              </p>
            </div>

            {currentMode === 'upgrade' && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>2 GB single file upload limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited simultaneous batch conversions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Priority queue with ultra-fast dedicated CPUs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Extended 24-hour file retention option</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-100 dark:focus:ring-slate-100 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
              >
                <span>{currentMode === 'upgrade' ? 'Continue with Pro ($9/mo)' : 'Sign In with Email'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setCurrentMode(currentMode === 'login' ? 'upgrade' : 'login')}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                {currentMode === 'login'
                  ? "Looking for Pro features? View Pro tier →"
                  : 'Already have an account? Sign in →'}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>No spam • One-click magic link • Instant activation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
