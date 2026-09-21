import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Home
      </Link>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/30 text-[10px] font-bold text-red-300 tracking-[0.15em] uppercase mb-4">
          <MessageCircle className="w-3 h-3" />
          Contact
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Contact Us
        </h1>
        <p className="text-sm text-gray-500">We'd love to hear from you.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Email</h2>
          </div>
          <p className="text-gray-400 mb-3">
            For questions, feedback, or support — send us an email.
          </p>
          <a
            href="mailto:contact@pdfplayofficial.com"
            className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold text-sm"
          >
            contact@pdfplayofficial.com
          </a>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white mb-3">Response Time</h2>
          <p className="text-gray-400">
            We usually respond within 24-48 hours. For urgent issues, please include "Urgent" in
            your subject line.
          </p>
        </div>
      </div>
    </div>
  );
}