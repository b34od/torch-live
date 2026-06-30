import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";
import { getPinnedUrgentAnnouncements } from "../../lib/data";

export default async function StaffLayout({ children }) {
  const { profile, supabase } = await requireUser(["staff", "admin"]);
  const { data: urgentAnnouncements } = await getPinnedUrgentAnnouncements(
    supabase,
    profile.program_year,
  );
  return (
    <AppShell role="staff" profile={profile} urgentAnnouncements={urgentAnnouncements || []}>
      {children}
    </AppShell>
  );
}
