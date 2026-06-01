import ProfileEditForm from "../../_components/ProfileEditForm";
import { requireUser } from "../../../lib/auth";

export const metadata = {
  title: "My Info",
};

export default async function StudentProfilePage() {
  const { profile } = await requireUser(["student"]);

  return (
    <section className="card">
      <h2>My Info</h2>
      <p className="muted">
        Control what others see in the directory and keep your contact info current.
      </p>
      <ProfileEditForm profile={profile} />
    </section>
  );
}
