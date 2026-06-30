import ProfileEditForm from "../../_components/ProfileEditForm";
import { requireUser } from "../../../lib/auth";

export const metadata = {
  title: "Admin Profile",
};

export default async function AdminProfilePage() {
  const { profile } = await requireUser(["admin"]);

  return (
    <section className="card">
      <h2>My Info</h2>
      <p className="muted">
        Control what others see in the directory and keep your admin profile current.
      </p>
      <ProfileEditForm profile={profile} />
    </section>
  );
}
