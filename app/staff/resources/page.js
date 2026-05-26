import { requireUser } from "../../../lib/auth";
import { getResourceCategories } from "../../../lib/data";

export const metadata = {
  title: "Staff Resources",
};

export default async function StaffResourcesPage() {
  const { supabase, profile } = await requireUser(["staff", "admin"]);
  const { data: categories, error } = await getResourceCategories(supabase, profile.program_year);

  return (
    <section className="card">
      <h2>Resources & Protocols</h2>
      <p className="muted">Operational references for staff and admin.</p>
      {error ? (
        <p className="alert alert-error mt-md">
          {error.message}
        </p>
      ) : categories.length === 0 ? (
        <p className="empty mt-md">
          No resources published yet.
        </p>
      ) : (
        <div className="stack mt-md">
          {categories.map((category) => (
            <article key={category.id} className="surface surface-pad">
              <h3>
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </h3>
              {category.resource_items?.length ? (
                category.resource_items.map((item) => (
                  <div key={item.id} className="resource-item">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <p className="muted">Visibility: {item.visibility}</p>
                  </div>
                ))
              ) : (
                <p className="empty">No items yet.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
