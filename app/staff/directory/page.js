import { requireUser } from "../../../lib/auth";
import DirectoryList from "../../_components/DirectoryList";

export const metadata = {
  title: "Directory",
};

export default async function StaffDirectoryPage() {
  const { supabase, profile } = await requireUser(["staff", "admin"]);

  const { data, error } = await supabase.rpc("get_directory_profiles", {
    year_param: profile.program_year,
  });

  return (
    <section className="card">
      <h2>Program Directory</h2>
      <p className="muted">Contact participants and view team/guild/room assignments.</p>
      {error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : (
        <DirectoryList profiles={data || []} showRoom={true} />
      )}
    </section>
  );
}
