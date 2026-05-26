import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";

export default async function StaffLayout({ children }) {
  const { profile } = await requireUser(["staff", "admin"]);
  return (
    <AppShell role="staff" profile={profile}>
      {children}
    </AppShell>
  );
}
