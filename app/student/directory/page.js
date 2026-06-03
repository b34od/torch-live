import Link from "next/link";
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
      <div className="directory-header">
        <h2>Program Directory</h2>
        <Link href="/student/profile" className="button button-secondary button-sm">
          Edit My Info
        </Link>
      </div>
      <p className="muted">
        Contact your teammates and staff. Use "Edit My Info" to control what others see.
      </p>
      {error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : (
        <DirectoryList profiles={data || []} showRoom={false} showPhone={false} showEmail={false} />
      )}
    </section>
  );
}
