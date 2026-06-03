import ProfileEditForm from "../../_components/ProfileEditForm";
import { requireUser } from "../../../lib/auth";

export const metadata = {
  title: "My Info",
};

export default async function StaffProfilePage() {
  const { profile } = await requireUser(["staff", "admin"]);

  return (
    <section className="card">
      <h2>My Info</h2>
      <p className="muted">
        Control what others see in the directory.
      </p>
      <ProfileEditForm profile={profile} />
    </section>
  );
}
