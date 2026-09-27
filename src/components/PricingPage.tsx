import React, { useState } from 'react';
import { Check, HelpCircle, Zap, Shield, Sparkles } from 'lucide-react';

interface PricingPageProps {
  onSelectPlan?: (plan: 'free' | 'pro' | 'business') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      badge: 'Current Plan',
      description: 'Everything you need for everyday quick conversions with zero cost.',
      priceMonthly: 0,
      priceYearly: 0,
      highlight: false,
      cta: 'Start Converting Free',
      features: [
        'Up to 500 MB per file',
        '10 simultaneous batch files',
        'Standard client & server queue',
        '50+ supported formats',
        'Client-side zero retention processing',
        '1-hour automatic file purge',
        'Standard conversion speed',
        'No account required',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Most Popular',
      description: 'For professionals and creators handling heavy media, RAWs, and large PDF sets.',
      priceMonthly: 9,
      priceYearly: 7, // $84/yr
      highlight: true,
      cta: 'Upgrade to Pro',
      features: [
        'Up to 2 GB per file',
        'Unlimited simultaneous batch files',
        'Priority high-speed dedicated queue',
        'High-resolution video encoding (4K)',
        'ConvertX AI Smart Assistant unlimited',
        'Extended 24-hour file storage option',
        'Ad-free uninterrupted interface',
        'Fast parallel multi-threaded workers',
        'Priority customer support',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      badge: 'For Teams',
      description: 'Dedicated infrastructure, API access, custom retention rules, and team seats.',
      priceMonthly: 29,
      priceYearly: 24, // $288/yr
      highlight: false,
      cta: 'Contact Sales / Get Team',
      features: [
        'Up to 10 GB per file',
        'Dedicated isolated worker instance',
        'ConvertX REST API with 100k calls/mo',
        'Custom webhooks & cloud storage sync',
        'Instant zero-queue processing',
        'Configurable retention (0 to 30 days)',
        'Custom team seats & SSO / SAML',
        'Enterprise SLA with 99.9% uptime',
        'Dedicated technical account manager',
      ],
    },
  ];

  const comparisonMatrix = [
    { feature: 'Maximum File Size', free: '500 MB', pro: '2 GB', business: '10 GB' },
    { feature: 'Simultaneous Batch Files', free: '10 files', pro: 'Unlimited', business: 'Unlimited' },
    { feature: 'Queue Priority', free: 'Standard', pro: 'High Priority', business: 'Dedicated Instance' },
    { feature: 'Processing Speeds', free: 'Fast', pro: 'Ultra Fast (4x)', business: 'Maximum (10x)' },
    { feature: 'ConvertX AI Assistant', free: '5 daily commands', pro: 'Unlimited', business: 'Unlimited + API' },
    { feature: 'Automatic File Purge', free: '1 Hour', pro: 'Configurable (1-24h)', business: 'Custom (0-30 days)' },
    { feature: 'Client-side WASM Security', free: 'Yes', pro: 'Yes', business: 'Yes' },
    { feature: 'Batch ZIP Packaging', free: 'Yes', pro: 'Yes', business: 'Yes' },
    { feature: 'Advertising / Sponsors', free: 'Minimal', pro: 'None (100% Clean)', business: 'None' },
    { feature: 'REST API Access', free: 'No', pro: 'No', business: 'Yes (Full API)' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Convert at the speed of your workflow.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Start 100% free with generous 500 MB limits, or upgrade to Pro for massive 2 GB files and dedicated processing priority.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {plans.map((p) => {
          const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly;

          return (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all ${
                p.highlight
                  ? 'border-slate-900 bg-white shadow-xl dark:border-slate-100 dark:bg-slate-900 ring-1 ring-slate-900 dark:ring-slate-100'
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider dark:bg-white dark:text-slate-900 shadow-sm">
                  {p.badge}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    ${price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {price === 0 ? 'forever' : '/ month'}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-3">Includes:</p>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => onSelectPlan && onSelectPlan(p.id as any)}
                  className={`w-full rounded-xl py-2.5 px-4 text-xs font-semibold transition-all cursor-pointer ${
                    p.highlight
                      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="max-w-5xl mx-auto pt-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Plan Feature Comparison
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare technical limits and capabilities side-by-side.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Capability</th>
                <th className="py-3.5 px-4 font-semibold text-center">Free</th>
                <th className="py-3.5 px-4 font-semibold text-center text-indigo-600 dark:text-indigo-400">Pro</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold text-center">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisonMatrix.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 sm:px-6 font-medium text-slate-900 dark:text-white">{row.feature}</td>
                  <td className="py-3 px-4 text-center">{row.free}</td>
                  <td className="py-3 px-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">{row.pro}</td>
                  <td className="py-3 px-4 sm:px-6 text-center">{row.business}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
