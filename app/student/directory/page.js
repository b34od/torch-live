import { requireUser } from "../../../lib/auth";
import DirectoryList from "../../_components/DirectoryList";

export const metadata = {
  title: "Directory",
};

export default async function StudentDirectoryPage() {
  const { supabase, profile } = await requireUser(["student"]);

  const { data, error } = await supabase.rpc("get_directory_profiles", {
    year_param: profile.program_year,
  });

  return (
    <section className="card">
      <h2>Program Directory</h2>
      <p className="muted">
        Contact your teammates and staff by email. Phone numbers are not shared in the app.
      </p>
      {error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : (
        <DirectoryList profiles={data || []} showRoom={false} />
      )}
    </section>
  );
}
