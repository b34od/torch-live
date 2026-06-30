import Link from "next/link";
import { requireUser } from "../../../lib/auth";
import DirectoryList from "../../_components/DirectoryList";

export const metadata = {
  title: "Admin Directory",
};

export default async function AdminDirectoryPage() {
  const { supabase, profile } = await requireUser(["admin"]);

  const { data, error } = await supabase.rpc("get_directory_profiles", {
    year_param: profile.program_year,
  });

  return (
    <section className="card">
      <div className="directory-header">
        <h2>Program Directory</h2>
        <Link href="/admin/profile" className="button button-secondary button-sm">
          Edit My Info
        </Link>
      </div>
      <p className="muted">
        Review the shared directory with staff-level context, including room assignments and social sharing where users opted in.
      </p>
      {error ? (
        <p className="alert alert-error">{error.message}</p>
      ) : (
        <DirectoryList profiles={data || []} showRoom={true} />
      )}
    </section>
  );
}
