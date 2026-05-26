import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";

export default async function AdminLayout({ children }) {
  const { profile } = await requireUser(["admin"]);
  return (
    <AppShell role="admin" profile={profile}>
      {children}
    </AppShell>
  );
}
