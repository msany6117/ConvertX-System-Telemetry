import React, { useState } from 'react';
import { Shield, Lock, Trash2, CheckCircle2, Mail, Send, HelpCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">About ConvertX</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          ConvertX was built on a simple conviction: media and document conversion should be fast, completely free, privacy-respecting, and without artificial paywalls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-4">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Strict Privacy</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Your files belong to you. We never inspect, index, or sell your documents. All files are securely wiped from our servers after 1 hour.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Accounts Required</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            No emails, no subscriptions, no credit cards, and no daily throttles. Convert whatever you need instantly in your browser.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center mb-4">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Open Source Core</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Powered by the world's most battle-tested open-source libraries: FFmpeg, ImageMagick, Sharp, Ghostscript, and PDF-Lib.
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
      <p className="text-xs text-slate-400">Effective Date: September 2026</p>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">1. 1-Hour Automatic File Destruction</h2>
        <p>
          Every file uploaded to ConvertX and every converted result is stored in an isolated, randomized temporary directory. Our background daemon executes continuous sweep routines that permanently purge and unlink all files whose age exceeds 1 hour (3600 seconds). Users may also click the trash/delete button at any time to immediately scrub their files from the disk.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">2. Zero Account Tracking</h2>
        <p>
          ConvertX does not mandate user accounts or registrations. We do not maintain user profiles, cross-site trackers, or advertising IDs.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">3. End-to-End Transport Encryption</h2>
        <p>
          All network traffic between your web browser and ConvertX is encrypted with modern TLS / HTTPS. Files in transit cannot be read or intercepted by third parties.
        </p>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">4. No Data Harvesting</h2>
        <p>
          We do not train machine learning models on your documents, images, audio, or video files. Content is processed solely in memory and disk for the singular duration of your conversion request.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
      <p className="text-xs text-slate-400">Last updated: September 2026</p>

      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          By accessing or utilizing the ConvertX service, you agree to comply with the following fair-use terms:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Permitted Use:</strong> You may use ConvertX for personal, academic, or commercial file conversion tasks within normal fair-use boundaries.</li>
          <li><strong>Prohibited Content:</strong> You may not upload malware, illegal material, unauthorized copyrighted content, or files intended to exploit server vulnerabilities.</li>
          <li><strong>Availability:</strong> ConvertX is provided on an "as-is" and "as-available" basis. While we strive for 99.9% uptime and high accuracy, we do not guarantee uninterrupted availability.</li>
          <li><strong>Automatic Purge:</strong> You acknowledge that files are deleted within 1 hour and ConvertX is not a backup or archival service.</li>
        </ul>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: 'Is ConvertX really 100% free?',
      a: 'Yes! All conversions, compressions, and utility tools are completely free to use without requiring an account or credit card.',
    },
    {
      q: 'What is the maximum file size limit?',
      a: 'You can upload files up to 500 MB each, with up to 10 simultaneous batch files.',
    },
    {
      q: 'Are my uploaded files safe and private?',
      a: 'Absolutely. We do not look at your files, and our automated server daemon deletes all files permanently 1 hour after upload or conversion.',
    },
    {
      q: 'Can I download all converted files at once?',
      a: 'Yes! When you convert multiple files, click the "Download All (ZIP)" button to get a single archive containing all your processed files.',
    },
    {
      q: 'Which video and audio formats are supported?',
      a: 'We support MP4, MOV, WEBM, MKV, AVI, GIF, MP3, WAV, AAC, FLAC, and OGG using high-performance FFmpeg encoding.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Everything you need to know about ConvertX</p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              {f.q}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact & Support</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Have a question, format suggestion, or bug report? Reach out to our open-source team.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-bold text-sm">Message Sent Successfully!</h4>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Thank you for reaching out. We will review your feedback shortly.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message or Feature Request
            </label>
            <textarea
              rows={4}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Message</span>
          </button>
        </form>
      )}
    </div>
  );
};
