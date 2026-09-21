import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
          <FileText className="w-3 h-3" />
          Legal
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500">
          Last updated: January 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-[15px] leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-400">
            By accessing or using PDFplayOfficial, you agree to be bound by these Terms of Service.
            If you do not agree with any part of these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Our Services</h2>
          <p className="text-gray-400 mb-3">
            PDFplayOfficial provides free online PDF tools that run entirely in your browser. All
            processing happens locally on your device — nothing is uploaded to any server.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
            <li>All tools are provided free of charge</li>
            <li>No signup or account is required</li>
            <li>No files are uploaded or stored</li>
            <li>Services are provided "as is"</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Acceptable Use</h2>
          <p className="text-gray-400 mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 ml-2">
            <li>Use our services for any illegal purpose</li>
            <li>Process files that you do not have the right to use</li>
            <li>Attempt to reverse-engineer, hack, or disrupt our services</li>
            <li>Use automated tools to overload our website</li>
            <li>Redistribute our tools as your own</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Intellectual Property</h2>
          <p className="text-gray-400">
            All content, logos, and design on PDFplayOfficial are our property. You may not copy,
            modify, or redistribute them without permission. Your files remain yours — we claim no
            ownership over any content you process.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. No Warranty</h2>
          <p className="text-gray-400">
            Our services are provided "as is" without any warranty. We do not guarantee that our
            tools will be error-free, uninterrupted, or produce perfect results. Use at your own
            risk and always keep backups of important files.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Limitation of Liability</h2>
          <p className="text-gray-400">
            PDFplayOfficial shall not be liable for any damages arising from the use of our services,
            including but not limited to data loss, file corruption, or any indirect damages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Changes to Terms</h2>
          <p className="text-gray-400">
            We reserve the right to update these terms at any time. Continued use of our services
            after changes means you accept the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Contact</h2>
          <p className="text-gray-400">
            For questions about these terms, contact us at{' '}
            <a href="mailto:contact@pdfplayofficial.com" className="text-red-400 hover:text-red-300">
              contact@pdfplayofficial.com
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