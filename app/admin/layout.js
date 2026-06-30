import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";
import { getPinnedUrgentAnnouncements } from "../../lib/data";

export default async function AdminLayout({ children }) {
  const { profile, supabase } = await requireUser(["admin"]);
  const { data: urgentAnnouncements } = await getPinnedUrgentAnnouncements(
    supabase,
    profile.program_year,
  );
  return (
    <AppShell role="admin" profile={profile} urgentAnnouncements={urgentAnnouncements || []}>
      {children}
    </AppShell>
  );
}
