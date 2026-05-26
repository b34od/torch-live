export const metadata = {
  title: "Safety & Emergency Disclaimer",
};

export default function SafetyPage() {
  return (
    <main className="legal-shell">
      <article className="card legal-card legal-prose">
        <h2>Safety & Emergency Disclaimer</h2>
        <p className="muted">Effective May 25, 2026</p>

        <h3>Not an Emergency Service</h3>
        <p>
          TORCH Live is an informational tool and is not monitored as a real-time emergency response
          system.
        </p>

        <h3>In Any Emergency</h3>
        <p>
          Call 911 immediately, then contact onsite TORCH staff or Stockton University emergency
          resources.
        </p>

        <h3>Source of Truth During Program Operations</h3>
        <p>
          In-app updates support operations, but direct instructions from TORCH staff always take
          priority when there is any conflict or safety concern.
        </p>

        <h3>Youth Protection</h3>
        <p>
          Torch Leadership Academy maintains youth-protection and crisis-management requirements for
          authorized volunteers and staff. App access is restricted to approved participants and
          authorized personnel.
        </p>

        <h3>Notification Limits</h3>
        <p>
          Push notifications and email delivery can be delayed by device settings, network
          conditions, or provider interruptions. Users should check the app directly for current
          updates.
        </p>

        <h3>Contact</h3>
        <p>
          For safety concerns, contact TORCH staff directly at
          <a href="mailto:info@torchleadershipacademy.org"> info@torchleadershipacademy.org</a> or
          call (609) 300-6397.
        </p>
      </article>
    </main>
  );
}
