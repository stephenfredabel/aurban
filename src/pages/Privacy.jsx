import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Shield } from 'lucide-react';

export default function Privacy() {
  const lastUpdated = new Date(2024, 11, 15);

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50 dark:bg-gray-900/30">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
            <Shield size={32} className="text-emerald-500" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-400">
            Last updated: {format(lastUpdated, 'd MMMM yyyy')}
          </p>
        </div>

        <div className="p-8 prose-sm prose bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10 dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">1. Information We Collect</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Account Information:</strong> Name, email address, phone number, profile photo, location.
            </p>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Provider Information:</strong> Business name, CAC registration, professional licenses, ID documents, bank account details.
            </p>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Usage Data:</strong> Search queries, property views, saved items, messages, booking history, payment transactions.
            </p>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Technical Data:</strong> IP address, device type, browser type, operating system, cookies, analytics data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">2. How We Use Your Information</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Provide and improve Platform services</li>
              <li>Process transactions and escrow payments</li>
              <li>Verify provider identities and credentials</li>
              <li>Send booking confirmations, inspection reminders, payment receipts</li>
              <li>Personalize search results and recommendations</li>
              <li>Detect and prevent fraud, abuse, or security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">3. Information Sharing</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              We do not sell your personal information. We share information only in these circumstances:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li><strong>With Providers:</strong> When you book an inspection or make an inquiry, we share your name and contact details with the provider.</li>
              <li><strong>Payment Processors:</strong> Paystack, Flutterwave, and other payment partners process transactions securely.</li>
              <li><strong>Service Providers:</strong> Cloud hosting, analytics, customer support tools.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">4. Data Security</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              We use industry-standard encryption (256-bit SSL) to protect data in transit. All payment data is processed through PCI-DSS compliant providers. Verification documents are encrypted and stored securely, accessible only by authorized personnel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">5. Your Rights</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request account deletion (30-day grace period)</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Data Portability:</strong> Export your data in machine-readable format</li>
            </ul>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              To exercise these rights, contact us at <a href="mailto:privacy@aurban.ng" className="font-semibold text-brand-gold hover:underline">privacy@aurban.ng</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">6. Cookies & Tracking</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              We use cookies to enhance your experience, remember preferences, and analyze usage patterns. You can disable cookies in your browser settings, but some features may not function properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">7. Data Retention</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              We retain your data for as long as your account is active or as needed to provide services. Deleted accounts are retained for 30 days, then permanently erased. Transaction records are kept for 7 years to comply with Nigerian tax and financial regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">8. Children's Privacy</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              Aurban is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has provided us with personal information, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">9. Contact</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              For privacy-related questions, contact:<br />
              Email: <a href="mailto:privacy@aurban.ng" className="font-semibold text-brand-gold hover:underline">privacy@aurban.ng</a><br />
              Address: Aurban Technologies Ltd., Lagos, Nigeria
            </p>
          </section>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8 text-sm">
          <Link to="/terms" className="font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark">
            Terms of Service
          </Link>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <Link to="/community-guidelines" className="font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark">
            Community Guidelines
          </Link>
        </div>
      </div>
    </div>
  );
}