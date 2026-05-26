import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "../../../components/ui/ConfirmSubmitButton";
import { requireUser } from "../../../lib/auth";
import { getResourceCategories } from "../../../lib/data";

function resourcesPageUrl(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `/admin/resources?${query}` : "/admin/resources";
}

function alertFromParams(params) {
  if (params?.category_saved === "1") {
    return { className: "alert alert-success", text: "Resource category added." };
  }
  if (params?.category_updated === "1") {
    return { className: "alert alert-success", text: "Resource category updated." };
  }
  if (params?.item_saved === "1") {
    return { className: "alert alert-success", text: "Resource item added." };
  }
  if (params?.item_updated === "1") {
    return { className: "alert alert-success", text: "Resource item updated." };
  }
  if (params?.item_removed === "1") {
    return { className: "alert alert-success", text: "Resource item removed." };
  }
  if (params?.category_removed === "1") {
    return { className: "alert alert-success", text: "Resource category removed." };
  }
  if (params?.error) {
    return { className: "alert alert-error", text: params.error };
  }
  return null;
}

function parseVisibility(value) {
  return ["all", "staff", "students"].includes(value) ? value : "all";
}

async function addCategory(formData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();

  if (!name) {
    redirect(resourcesPageUrl({ error: "Category name is required." }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { data: lastRows } = await supabase
    .from("resource_categories")
    .select("sort_order")
    .eq("program_year", profile.program_year)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (lastRows?.[0]?.sort_order || 0) + 1;
  const { error } = await supabase.from("resource_categories").insert({
    program_year: profile.program_year,
    name,
    icon: icon || null,
    sort_order: nextSort,
  });

  if (error) {
    redirect(resourcesPageUrl({ error: error.message }));
  }

  redirect(resourcesPageUrl({ category_saved: "1" }));
}

async function updateCategory(formData) {
  "use server";
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();

  if (!id) {
    redirect(resourcesPageUrl({ error: "Missing category id." }));
  }

  if (!name) {
    redirect(resourcesPageUrl({ error: "Category name is required.", edit_category: id }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("resource_categories")
    .update({
      name,
      icon: icon || null,
    })
    .eq("id", id)
    .eq("program_year", profile.program_year);

  if (error) {
    redirect(resourcesPageUrl({ error: error.message, edit_category: id }));
  }

  redirect(resourcesPageUrl({ category_updated: "1" }));
}

async function addResourceItem(formData) {
  "use server";
  const categoryId = String(formData.get("category_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const visibility = parseVisibility(String(formData.get("visibility") || "all"));

  if (!categoryId || !title || !body) {
    redirect(resourcesPageUrl({ error: "Category, title, and body are required." }));
  }

  const { supabase } = await requireUser(["admin"]);
  const { data: lastRows } = await supabase
    .from("resource_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSort = (lastRows?.[0]?.sort_order || 0) + 1;
  const { error } = await supabase.from("resource_items").insert({
    category_id: categoryId,
    title,
    body,
    visibility,
    sort_order: nextSort,
  });

  if (error) {
    redirect(resourcesPageUrl({ error: error.message }));
  }

  redirect(resourcesPageUrl({ item_saved: "1" }));
}

async function updateResourceItem(formData) {
  "use server";
  const id = String(formData.get("id") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const visibility = parseVisibility(String(formData.get("visibility") || "all"));

  if (!id) {
    redirect(resourcesPageUrl({ error: "Missing resource item id." }));
  }

  if (!categoryId || !title || !body) {
    redirect(resourcesPageUrl({ error: "Category, title, and body are required.", edit_item: id }));
  }

  const { supabase } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("resource_items")
    .update({
      category_id: categoryId,
      title,
      body,
      visibility,
    })
    .eq("id", id);

  if (error) {
    redirect(resourcesPageUrl({ error: error.message, edit_item: id }));
  }

  redirect(resourcesPageUrl({ item_updated: "1" }));
}

async function removeResourceItem(formData) {
  "use server";

  const itemId = String(formData.get("id") || "").trim();
  if (!itemId) {
    redirect(resourcesPageUrl({ error: "Missing resource item id." }));
  }

  const { supabase } = await requireUser(["admin"]);
  const { error } = await supabase.from("resource_items").delete().eq("id", itemId);

  if (error) {
    redirect(resourcesPageUrl({ error: error.message }));
  }

  redirect(resourcesPageUrl({ item_removed: "1" }));
}

async function removeCategory(formData) {
  "use server";

  const categoryId = String(formData.get("id") || "").trim();
  if (!categoryId) {
    redirect(resourcesPageUrl({ error: "Missing category id." }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("resource_categories")
    .delete()
    .eq("id", categoryId)
    .eq("program_year", profile.program_year);

  if (error) {
    redirect(resourcesPageUrl({ error: error.message }));
  }

  redirect(resourcesPageUrl({ category_removed: "1" }));
}

export const metadata = {
  title: "Admin Resources",
};

export default async function AdminResourcesPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const alert = alertFromParams(params || {});
  const { supabase, profile } = await requireUser(["admin"]);
  const { data: categories, error } = await getResourceCategories(supabase, profile.program_year);
  const editingCategoryId = String(params?.edit_category || "").trim();
  const editingItemId = String(params?.edit_item || "").trim();
  const editingCategory = categories.find((category) => category.id === editingCategoryId) || null;
  const resourceItems = categories.flatMap((category) =>
    (category.resource_items || []).map((item) => ({ ...item, category_id: category.id })),
  );
  const editingItem = resourceItems.find((item) => item.id === editingItemId) || null;

  return (
    <>
      <section className="card">
        <h2>{editingCategory ? "Edit Resource Category" : "Resource Categories"}</h2>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <form action={editingCategory ? updateCategory : addCategory} className="grid-two">
          {editingCategory ? <input type="hidden" name="id" value={editingCategory.id} /> : null}
          <div className="field">
            <label className="label" htmlFor="name">
              Category Name
            </label>
            <input id="name" name="name" className="input" defaultValue={editingCategory?.name || ""} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="icon">
              Icon (optional emoji)
            </label>
            <input id="icon" name="icon" className="input" defaultValue={editingCategory?.icon || ""} />
          </div>
          <button type="submit" className="button button-primary">
            {editingCategory ? "Save Category" : "Add Category"}
          </button>
        </form>
        {editingCategory ? (
          <p className="muted mt-sm">
            <Link href={resourcesPageUrl()}>Done editing</Link>
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>{editingItem ? "Edit Resource Item" : "Add Resource Item"}</h2>
        <form action={editingItem ? updateResourceItem : addResourceItem} className="stack">
          {editingItem ? <input type="hidden" name="id" value={editingItem.id} /> : null}
          <div className="field">
            <label className="label" htmlFor="category_id">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              className="select"
              defaultValue={editingItem?.category_id || ""}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="title">
              Item Title
            </label>
            <input id="title" name="title" className="input" defaultValue={editingItem?.title || ""} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="body">
              Item Body (Markdown supported)
            </label>
            <textarea id="body" name="body" className="textarea" defaultValue={editingItem?.body || ""} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="visibility">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              className="select"
              defaultValue={editingItem?.visibility || "all"}
            >
              <option value="all">All</option>
              <option value="staff">Staff only</option>
              <option value="students">Students only</option>
            </select>
          </div>
          <button type="submit" className="button button-primary">
            {editingItem ? "Save Resource Item" : "Add Resource Item"}
          </button>
        </form>
        {editingItem ? (
          <p className="muted mt-sm">
            <Link href={resourcesPageUrl()}>Done editing</Link>
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Current Resources</h2>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : categories.length === 0 ? (
          <p className="empty">No categories yet.</p>
        ) : (
          <div className="stack">
            {categories.map((category) => (
              <article key={category.id} className="surface surface-pad-sm">
                <h3>
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </h3>
                <p className="muted">Removing a category also removes all items inside it.</p>
                <div className="item-actions mt-sm">
                  <Link href={resourcesPageUrl({ edit_category: category.id })} className="day-tab">
                    Edit Category
                  </Link>
                  <form action={removeCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmSubmitButton
                      label="Remove Category"
                      className="button button-secondary"
                      confirmMessage="Remove this category and all of its resource items?"
                    />
                  </form>
                </div>
                {category.resource_items?.length ? (
                  category.resource_items.map((item) => (
                    <div key={item.id} className="resource-item">
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                      <p className="muted">Visibility: {item.visibility}</p>
                      <div className="item-actions mt-sm">
                        <Link href={resourcesPageUrl({ edit_item: item.id })} className="day-tab">
                          Edit Item
                        </Link>
                        <form action={removeResourceItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <ConfirmSubmitButton
                            label="Remove Item"
                            className="button button-ghost"
                            confirmMessage="Remove this resource item?"
                          />
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty">No items in this category yet.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
