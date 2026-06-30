import { requireUser } from "../../../lib/auth";
import { getResourceCategories } from "../../../lib/data";

export const metadata = {
  title: "Student Resources",
};

export default async function StudentResourcesPage() {
  const { supabase, profile } = await requireUser(["student"]);
  const { data: categories, error } = await getResourceCategories(supabase, profile.program_year);

  return (
    <section className="card">
      <h2>Resources</h2>
      <p className="muted">Program info, campus support details, and frequently asked questions.</p>
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
                  <div key={item.id} id={`resource-${item.id}`} className="resource-item">
                    {item.url ? (
                      <strong><a href={item.url} target="_blank" rel="noreferrer noopener" className="text-link">{item.title}</a></strong>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    {item.body ? <p>{item.body}</p> : null}
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
