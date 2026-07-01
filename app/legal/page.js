import Link from "next/link";

export const metadata = {
  title: "Legal",
};

export default function LegalIndexPage() {
  return (
    <main className="legal-shell">
      <section className="card legal-card">
        <h2>Legal & Safety</h2>
        <div className="stack mt-md">
          <Link href="/legal/privacy" className="day-tab">
            Privacy Notice
          </Link>
          <Link href="/legal/terms" className="day-tab">
            Terms of Use
          </Link>
          <Link href="/legal/safety" className="day-tab">
            Safety & Emergency Disclaimer
          </Link>
        </div>
      </section>
    </main>
  );
}
