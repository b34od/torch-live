import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";

export default async function StudentLayout({ children }) {
  const { profile } = await requireUser(["student"]);
  return (
    <AppShell role="student" profile={profile}>
      {children}
    </AppShell>
  );
}
