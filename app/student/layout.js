import AppShell from "../../components/shell/AppShell";
import { requireUser } from "../../lib/auth";
import { getPinnedUrgentAnnouncements } from "../../lib/data";

export default async function StudentLayout({ children }) {
  const { profile, supabase } = await requireUser(["student"]);
  const { data: urgentAnnouncements } = await getPinnedUrgentAnnouncements(
    supabase,
    profile.program_year,
  );
  return (
    <AppShell role="student" profile={profile} urgentAnnouncements={urgentAnnouncements || []}>
      {children}
    </AppShell>
  );
}
