import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-300">

      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/30 text-[10px] font-bold text-red-300 tracking-[0.15em] uppercase mb-4">
          <Shield className="w-3 h-3" />
          Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500">
          Last updated: January 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-[15px] leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
          <p className="text-gray-400">
            Welcome to PDFplayOfficial. We respect your privacy and are committed to protecting your
            personal data. This privacy policy explains how we handle your information when you use
            our website and tools.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Files You Process</h2>
          <p className="text-gray-400 mb-3">
            <strong className="text-white">Your files never leave your device.</strong> All PDF
            processing happens locally in your browser. We do not upload, store, or have access to
            any files you use with our tools.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
            <li>No file is uploaded to any server</li>
            <li>No file is stored on our systems</li>
            <li>No file is shared with any third party</li>
            <li>Everything is processed in your browser's memory</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Information We Collect</h2>
          <p className="text-gray-400 mb-3">
            We do <strong className="text-white">not</strong> collect any personal information. We
            do not require signup, login, or email. We do not track you across websites.
          </p>
          <p className="text-gray-400">
            Basic anonymous analytics (like page views) may be collected to improve our service,
            but this data is never linked to any individual.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Cookies</h2>
          <p className="text-gray-400">
            We use minimal cookies only for essential functionality. We do not use tracking cookies,
            advertising cookies, or any third-party cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Third-Party Services</h2>
          <p className="text-gray-400">
            Our tools run entirely in your browser. We do not share any data with third parties.
            If we use any external libraries (like PDF.js), they run locally in your browser and do
            not send data anywhere.
          </p>
        </section>

        
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Changes to This Policy</h2>
          <p className="text-gray-400">
            We may update this privacy policy from time to time. Any changes will be posted on this
            page with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Contact Us</h2>
          <p className="text-gray-400">
            If you have any questions about this privacy policy, please contact us at{' '}
            <a href="mailto:pdfplayofficial@gmail.com" className="text-red-400 hover:text-red-300">
              pdfplayofficial@gmail.com
            </a>
            .
          </p>
        </section>

      </div>

      {/* Footer note */}
      <div className="mt-12 pt-6 border-t border-white/5 text-xs text-gray-600">
        © 2026 PDFplayOfficial. All rights reserved.
      </div>
    </div>
  );
}