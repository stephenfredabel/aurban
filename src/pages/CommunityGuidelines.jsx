import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

export default function CommunityGuidelines() {
  const lastUpdated = new Date(2024, 11, 15);

  return (
    <div className="min-h-screen px-4 py-10 bg-gray-50 dark:bg-gray-900/30">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-500/20 rounded-3xl">
            <Users size={32} className="text-blue-500" />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            Community Guidelines
          </h1>
          <p className="text-sm text-gray-400">
            Last updated: {format(lastUpdated, 'd MMMM yyyy')}
          </p>
        </div>

        <div className="p-8 prose-sm prose bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-3xl dark:border-white/10 dark:prose-invert max-w-none">
          
          <p className="mb-8 leading-relaxed text-gray-600 dark:text-white/70">
            Aurban is built on trust, transparency, and respect. These guidelines help maintain a safe, welcoming community for everyone.
          </p>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Be Honest & Transparent</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Provide accurate descriptions of properties, services, and products</li>
              <li>Use real, recent photos — no stock images or misleading representations</li>
              <li>Disclose all fees, deposits, and conditions upfront</li>
              <li>If something changes (price, availability), update your listing immediately</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Respect Everyone</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Treat all users with kindness and professionalism</li>
              <li>No discrimination based on race, religion, gender, disability, or any protected class</li>
              <li>Respond to messages and inquiries respectfully and promptly</li>
              <li>Respect people's time — honor bookings and confirmed appointments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Keep It Safe</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Never share personal financial information (bank details, card numbers) via messages</li>
              <li>Use Aurban's escrow system for all transactions — it protects both parties</li>
              <li>Meet in public places for inspections when possible</li>
              <li>Report suspicious activity, scams, or fraudulent listings immediately</li>
              <li>Trust your instincts — if something feels off, it probably is</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">What's Not Allowed</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              The following behaviors will result in account suspension or permanent ban:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li><strong>Scams & Fraud:</strong> Fake listings, phishing, identity theft, or any deceptive practices</li>
              <li><strong>Harassment:</strong> Threatening, bullying, stalking, or abusive behavior</li>
              <li><strong>Hate Speech:</strong> Content that promotes violence or hatred against individuals or groups</li>
              <li><strong>Spam:</strong> Unsolicited messages, excessive self-promotion, or bot activity</li>
              <li><strong>Off-Platform Transactions:</strong> Asking users to pay outside Aurban to avoid fees</li>
              <li><strong>Price Gouging:</strong> Exploiting emergencies or demand spikes with unreasonable prices</li>
              <li><strong>Fake Reviews:</strong> Posting reviews for properties/services you didn't use, or soliciting fake reviews</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Content Standards</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Photos must be of the actual property/product — no misleading images</li>
              <li>Descriptions should be factual and detailed</li>
              <li>No offensive, violent, or sexually explicit content</li>
              <li>Respect intellectual property — don't use copyrighted images or text without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Reviews & Ratings</h2>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Leave honest, constructive feedback based on your actual experience</li>
              <li>Focus on the property/service, not personal attacks</li>
              <li>Providers: respond professionally to negative reviews — explain your side calmly</li>
              <li>Don't offer incentives (money, discounts) for positive reviews</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Reporting Violations</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              If you encounter content or behavior that violates these guidelines:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li>Use the "Report" button on listings, messages, or profiles</li>
              <li>Provide specific details about the violation</li>
              <li>We review reports within 24 hours</li>
              <li>False reports may result in account penalties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Consequences</h2>
            <p className="mb-3 leading-relaxed text-gray-600 dark:text-white/70">
              Violations may result in:
            </p>
            <ul className="pl-6 space-y-2 text-gray-600 list-disc dark:text-white/70">
              <li><strong>Warning:</strong> First-time minor offenses</li>
              <li><strong>Content Removal:</strong> Offending listings or messages deleted</li>
              <li><strong>Temporary Suspension:</strong> 7–30 days for repeat violations</li>
              <li><strong>Permanent Ban:</strong> Severe violations, fraud, or repeated offenses</li>
              <li><strong>Legal Action:</strong> Illegal activity reported to authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-brand-charcoal-dark dark:text-white">Questions?</h2>
            <p className="leading-relaxed text-gray-600 dark:text-white/70">
              If you're unsure whether something violates these guidelines, contact us at{' '}
              <a href="mailto:community@aurban.ng" className="font-semibold text-brand-gold hover:underline">community@aurban.ng</a>.<br />
              We're here to help keep Aurban safe for everyone.
            </p>
          </section>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8 text-sm">
          <Link to="/terms" className="font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark">
            Terms of Service
          </Link>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <Link to="/privacy" className="font-semibold transition-colors text-brand-gold hover:text-brand-gold-dark">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}