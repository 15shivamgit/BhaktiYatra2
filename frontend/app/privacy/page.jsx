import ProsePage from '@/components/layout/ProsePage';
import { BUSINESS } from '@/lib/config';
import { t } from '@/lib/i18n';

export const metadata = { title: t('pages.privacy'), alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <ProsePage title={t('pages.privacy')} updated="20 October 2026">
      <p>
        This policy explains what personal information {BUSINESS.name} collects, why, and how you
        can control it. We collect only what we need to run the website and our tours.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address and, if you add it, your phone
          number. If you sign in with Google, we receive your name, email address and profile photo
          from Google.
        </li>
        <li>
          <strong>Booking details</strong> (when tours open): traveller names, ages and genders,
          contact details and payment references. We never store card or UPI details; payments are
          handled by Razorpay.
        </li>
        <li>
          <strong>Messages</strong> you send through the contact form.
        </li>
        <li>
          <strong>Basic technical data</strong> needed for security, such as a one-way hash of your
          IP address on contact messages, and server logs kept for a short time.
        </li>
      </ul>
      <h2>Cookies</h2>
      <p>
        We use one essential cookie to keep you signed in, and a short-lived cookie during Google
        sign-in. We do not use advertising or tracking cookies.
      </p>
      <h2>How we use your information</h2>
      <ul>
        <li>To provide your account, bookings, tickets and receipts.</li>
        <li>To reply to your questions and send service emails about your account or bookings.</li>
        <li>To keep the website secure and prevent abuse.</li>
      </ul>
      <p>We do not sell your personal information.</p>
      <h2>Service providers</h2>
      <p>
        We use trusted providers to run the service: MongoDB Atlas (database hosting), Cloudinary
        (images and documents), Resend (email), Google (optional sign-in) and Razorpay (payments).
        They process data only on our instructions.
      </p>
      <h2>How long we keep it</h2>
      <p>
        Account information is kept while your account is active. Booking records are kept as
        required for accounting and legal purposes. Contact messages are kept for up to two years.
      </p>
      <h2>Your choices</h2>
      <p>
        You can update your name and phone number on your profile page. To ask for a copy of your
        data or to delete your account, write to{' '}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
      </p>
      <h2>Contact</h2>
      <p>
        {BUSINESS.name}, {BUSINESS.address}. Phone {BUSINESS.phoneDisplay}.
      </p>
    </ProsePage>
  );
}
