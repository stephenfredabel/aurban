import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Scale, FileText, AlertTriangle } from 'lucide-react';

export default function Terms() {
  const lastUpdated = new Date(2024, 11, 15); // Dec 15, 2024

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50 dark:bg-gray-900/30">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-brand-gold/10 rounded-3xl">
            <Scale size={32} className="text-brand-gold" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400">
            Last updated: {format(lastUpdated, 'd MMMM yyyy')}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 prose-sm prose bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10 dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              By accessing or using Aurban ("the Platform"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use the Platform.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              Aurban is operated by Aurban Technologies Ltd., a company registered in Nigeria. These terms constitute a legally binding agreement between you and Aurban Technologies Ltd.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">2. Platform Services</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              Aurban provides a marketplace platform that connects:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Property seekers with property owners, agents, and landlords</li>
              <li>Service seekers with real estate service providers (plumbers, electricians, architects, etc.)</li>
              <li>Buyers with sellers of real estate products (building materials, fittings, furniture, etc.)</li>
            </ul>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              Aurban acts as an intermediary platform only. We do not own, sell, or provide the properties, services, or products listed on the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">3. User Accounts</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              To use certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              You must be at least 18 years old to create an account. By creating an account, you represent that you meet this age requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">4. Provider Obligations</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              If you list properties, services, or products ("Providers"), you agree to:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Provide accurate, complete, and up-to-date listings</li>
              <li>Hold all necessary licenses, permits, and insurance required by law</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Honor bookings and confirmed transactions</li>
              <li>Respond to inquiries within a reasonable timeframe</li>
              <li>Not discriminate against users based on race, religion, gender, or any protected class</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">5. Payment & Commission</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Commission Structure:</strong> Aurban charges an 8% commission on completed transactions. This commission is absorbed by Aurban and not passed on to users.
            </p>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Escrow System:</strong> Payments made through the Platform are held in escrow until:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>The user confirms receipt of services, keys, or products, OR</li>
              <li>48 hours after the user's confirmation (dispute window expires)</li>
            </ul>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Dispute Window:</strong> Users have 48 hours after confirming a transaction to raise a dispute. After this period, payments are released to providers and cannot be reversed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">6. Cancellations & Refunds</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Inspection Bookings:</strong> Users may cancel inspections up to the provider's specified cancellation notice period (typically 12–24 hours) at no charge.
            </p>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Service Bookings:</strong> Cancellation policies are set by individual providers and displayed at the time of booking.
            </p>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Property Transactions:</strong> For rent, lease, or sale transactions, cancellation terms are governed by the agreement between the user and provider. Aurban does not guarantee refunds outside of the escrow dispute window.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">7. Prohibited Activities</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              You may not:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Engage in price manipulation or bid rigging</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Attempt to circumvent the Platform to avoid fees</li>
              <li>Use automated scripts or bots without authorization</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">8. Verification & Trust</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              Aurban offers verification services for providers (ID verification, business registration, professional licenses). While we strive to verify information accurately, we do not guarantee the accuracy or reliability of user-provided information. Users transact at their own risk.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              Verified badges indicate that a provider has submitted documents for review. This does not constitute an endorsement or guarantee of quality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">9. Intellectual Property</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              All content on the Platform, including logos, designs, text, graphics, and software, is the property of Aurban Technologies Ltd. or its licensors. You may not copy, modify, distribute, or create derivative works without explicit permission.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              By posting content on the Platform, you grant Aurban a non-exclusive, worldwide, royalty-free license to use, display, and promote your content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">10. Limitation of Liability</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              Aurban is provided "as is" without warranties of any kind. We are not liable for:
            </p>
            <ul className="pl-6 mt-3 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Disputes between users and providers</li>
              <li>Quality, safety, legality, or accuracy of listings</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              Our total liability shall not exceed the amount paid by you to Aurban in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">11. Indemnification</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              You agree to indemnify and hold harmless Aurban Technologies Ltd., its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform, violation of these Terms, or infringement of third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">12. Termination</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any reason we deem necessary to protect the Platform or its users.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-white/70">
              You may delete your account at any time through the Settings page. Deleted accounts are subject to a 30-day grace period before permanent deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">13. Governing Law</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">14. Changes to Terms</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new Terms. We will notify users of material changes via email or Platform notification.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">15. Contact</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              For questions about these Terms, contact us at:
            </p>
            <p className="mt-2 leading-relaxed text-gray-600 dark:text-white/70">
              <strong>Aurban Technologies Ltd.</strong><br />
              Lagos, Nigeria<br />
              Email: <a href="mailto:legal@aurban.ng" className="font-semibold text-brand-gold hover:underline">legal@aurban.ng</a><br />
              Support: <a href="mailto:support@aurban.ng" className="font-semibold text-brand-gold hover:underline">support@aurban.ng</a>
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 mt-8 text-sm">
          <Link to="/privacy" className="font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark">
            Privacy Policy
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