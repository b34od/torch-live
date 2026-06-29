import Link from "next/link";

export const metadata = {
  title: "Terms of Use",
};

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <article className="card legal-card legal-prose">
        <Link href="/legal" className="legal-close" aria-label="Close">&times;</Link>
        <h2>TORCH Live Terms of Use</h2>
        <p className="muted">Effective May 25, 2026</p>

        <h3>Eligibility</h3>
        <p>
          TORCH Live is for authorized Torch Leadership Academy participants, volunteers, and staff
          only. Users must be age 14 or older. Access may be revoked at any time for misuse or
          unauthorized access.
        </p>

        <h3>Acceptable Use</h3>
        <p>
          Users agree not to attempt unauthorized access, interfere with app operations, share
          access links, or post content that is abusive, unlawful, or unsafe.
        </p>

        <h3>Accounts & Security</h3>
        <p>
          Sign-in is passwordless by magic link. Users are responsible for securing their email
          account and device.
        </p>

        <h3>Operational Content</h3>
        <p>
          Schedule and announcement information may change quickly. Users should follow the latest
          in-app updates and staff direction during program activities.
        </p>

        <h3>Communications Scope</h3>
        <p>
          Messaging in TORCH Live is operational and transactional for authorized program
          activities. The app is not intended for marketing communications.
        </p>

        <h3>Suspension & Termination</h3>
        <p>
          TORCH may suspend or remove access for policy violations, inactivity, or operational
          reasons.
        </p>

        <h3>Liability</h3>
        <p>
          TORCH Live is provided for program coordination. It does not replace direct supervision,
          emergency protocols, or official staff instructions.
        </p>

        <h3>Contact</h3>
        <p>
          Terms questions:{" "}
          <a href="mailto:info@torchleadershipacademy.org">info@torchleadershipacademy.org</a> or{" "}
          <a href="mailto:bo@torchleadershipacademy.org">bo@torchleadershipacademy.org</a>.
        </p>
        <p>
          Torch Leadership Academy, Inc., 148 Heather Road, Haddon Township, NJ 08017, (609)
          300-6397.
        </p>

      </article>
    </main>
  );
}
