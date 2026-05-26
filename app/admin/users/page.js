import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/auth";
import { getUserProfiles } from "../../../lib/data";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";

const ROLES = ["student", "staff", "admin"];
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;
const BULK_LIMIT = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function countByRole(profiles, role) {
  return profiles.filter((profile) => profile.role === role && profile.is_active).length;
}

function rolePillClass(role) {
  if (role === "admin") return "pill-admin";
  if (role === "staff") return "pill-staff";
  return "pill-student";
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email || ""));
}

function parseProgramYear(value, fallback) {
  const year = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return fallback;
  }
  return year;
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseBulkRows(input, fallbackYear) {
  const rows = [];
  const lines = String(input || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));

  if (!lines.length) {
    return rows;
  }

  let headerMap = null;
  const firstLineColumns = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const looksLikeHeader =
    firstLineColumns.includes("email") &&
    (firstLineColumns.includes("name") || firstLineColumns.includes("full_name"));

  if (looksLikeHeader) {
    headerMap = {
      name: firstLineColumns.indexOf("full_name") >= 0 ? firstLineColumns.indexOf("full_name") : firstLineColumns.indexOf("name"),
      email: firstLineColumns.indexOf("email"),
      role: firstLineColumns.indexOf("role"),
      year: firstLineColumns.indexOf("program_year") >= 0 ? firstLineColumns.indexOf("program_year") : firstLineColumns.indexOf("year"),
    };
  }

  const startIndex = headerMap ? 1 : 0;

  for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
    const columns = parseCsvLine(lines[lineIndex]);

    const fullName = headerMap ? columns[headerMap.name] : columns[0];
    const email = headerMap ? columns[headerMap.email] : columns[1];
    const role = headerMap ? columns[headerMap.role] : columns[2];
    const rowYear = headerMap && headerMap.year >= 0 ? columns[headerMap.year] : columns[3];

    rows.push({
      rowNumber: lineIndex + 1,
      fullName: String(fullName || "").trim(),
      email: normalizeEmail(email),
      role: String(role || "").trim().toLowerCase(),
      programYear: parseProgramYear(rowYear, fallbackYear),
    });
  }

  return rows;
}

function getYearOptions(years, selectedYear, fallbackYear) {
  const set = new Set([selectedYear, fallbackYear]);
  years.forEach((year) => {
    if (Number.isFinite(Number(year))) {
      set.add(Number(year));
    }
  });

  return [...set].sort((a, b) => b - a);
}

function usersPageUrl(year, params = {}) {
  const search = new URLSearchParams({ year: String(year) });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return `/admin/users?${search.toString()}`;
}

function alertFromParams(params) {
  if (params?.created === "1") {
    return { className: "alert alert-success", text: "User account created and assigned." };
  }

  if (params?.saved === "1") {
    return { className: "alert alert-success", text: "User profile updated." };
  }

  if (params?.toggled === "1") {
    return { className: "alert alert-success", text: "User status updated." };
  }

  if (params?.removed === "1") {
    return { className: "alert alert-success", text: "User removed from TORCH Live." };
  }

  if (params?.deactivated === "1") {
    const count = Number(params?.count || 0);
    return {
      className: "alert alert-success",
      text: `Deactivated ${count} account${count === 1 ? "" : "s"} for that year.`,
    };
  }

  if (params?.imported === "1") {
    const created = Number(params?.created_count || 0);
    const linked = Number(params?.linked_count || 0);
    const skipped = Number(params?.skipped_count || 0);
    const failed = Number(params?.failed_count || 0);
    return {
      className: failed > 0 ? "alert alert-error" : "alert alert-success",
      text: `Import complete. Created ${created}, linked ${linked}, skipped ${skipped}, failed ${failed}.`,
    };
  }

  if (params?.error) {
    return { className: "alert alert-error", text: params.error };
  }

  return null;
}

async function listAllAuthUsersByEmail(adminClient) {
  const usersByEmail = new Map();
  const perPage = 1000;

  for (let page = 1; page <= 25; page += 1) {
    const listed = await adminClient.auth.admin.listUsers({ page, perPage });
    if (listed.error) {
      throw new Error(listed.error.message);
    }

    const users = listed.data?.users || [];
    users.forEach((entry) => {
      const email = normalizeEmail(entry.email);
      if (email) {
        usersByEmail.set(email, entry);
      }
    });

    if (users.length < perPage) {
      break;
    }
  }

  return usersByEmail;
}

async function createOrFetchAuthUser(adminClient, usersByEmail, email, fullName) {
  const existing = usersByEmail.get(email);
  if (existing?.id) {
    return { id: existing.id, created: false };
  }

  const created = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (created.error) {
    if (created.error.message === "A user with this email address has already been registered") {
      const refreshed = await listAllAuthUsersByEmail(adminClient);
      const found = refreshed.get(email);
      if (found?.id) {
        return { id: found.id, created: false };
      }
    }

    throw new Error(created.error.message);
  }

  const user = created.data?.user;
  if (!user?.id) {
    throw new Error("Auth user creation returned no user id.");
  }

  usersByEmail.set(email, user);
  return { id: user.id, created: true };
}

async function createProgramUser(formData) {
  "use server";

  const { profile } = await requireUser(["admin"]);
  const fullName = String(formData.get("full_name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const role = String(formData.get("role") || "")
    .trim()
    .toLowerCase();
  const selectedYear = parseProgramYear(formData.get("program_year"), profile.program_year);

  if (!fullName || !email || !role) {
    redirect(usersPageUrl(selectedYear, { error: "Name, email, and role are required." }));
  }

  if (!isValidEmail(email)) {
    redirect(usersPageUrl(selectedYear, { error: "Enter a valid email address." }));
  }

  if (!ROLES.includes(role)) {
    redirect(usersPageUrl(selectedYear, { error: "Invalid role." }));
  }

  const adminClient = createAdminSupabaseClient();
  let createErrorMessage = "";

  try {
    const usersByEmail = await listAllAuthUsersByEmail(adminClient);
    const authUser = await createOrFetchAuthUser(adminClient, usersByEmail, email, fullName);

    const updatedAuth = await adminClient.auth.admin.updateUserById(authUser.id, {
      email,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    });

    if (updatedAuth.error) {
      throw new Error(updatedAuth.error.message);
    }

    const { error: profileError } = await adminClient.from("user_profiles").upsert(
      {
        id: authUser.id,
        email,
        full_name: fullName,
        role,
        is_active: true,
        program_year: selectedYear,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error(profileError.message);
    }
  } catch (error) {
    createErrorMessage = error?.message || "User creation failed.";
  }

  if (createErrorMessage) {
    redirect(usersPageUrl(selectedYear, { error: createErrorMessage }));
  }

  redirect(usersPageUrl(selectedYear, { created: "1" }));
}

async function bulkImportUsers(formData) {
  "use server";

  const { profile } = await requireUser(["admin"]);
  const selectedYear = parseProgramYear(formData.get("program_year"), profile.program_year);
  const csvTextInput = String(formData.get("bulk_csv") || "").trim();
  const csvFile = formData.get("bulk_file");

  let csvText = csvTextInput;
  if (!csvText && csvFile && typeof csvFile.text === "function" && csvFile.size > 0) {
    csvText = String(await csvFile.text());
  }

  if (!csvText.trim()) {
    redirect(usersPageUrl(selectedYear, { error: "Paste CSV or upload a .csv file." }));
  }

  const parsedRows = parseBulkRows(csvText, selectedYear);

  if (!parsedRows.length) {
    redirect(usersPageUrl(selectedYear, { error: "No valid rows found in CSV." }));
  }

  if (parsedRows.length > BULK_LIMIT) {
    redirect(usersPageUrl(selectedYear, { error: `CSV exceeds ${BULK_LIMIT} rows.` }));
  }

  const adminClient = createAdminSupabaseClient();
  let createdCount = 0;
  let linkedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let importErrorMessage = "";

  try {
    const usersByEmail = await listAllAuthUsersByEmail(adminClient);

    for (const row of parsedRows) {
      if (!row.fullName || !row.email || !row.role) {
        skippedCount += 1;
        continue;
      }

      if (!ROLES.includes(row.role)) {
        skippedCount += 1;
        continue;
      }

      if (!isValidEmail(row.email)) {
        skippedCount += 1;
        continue;
      }

      try {
        const authUser = await createOrFetchAuthUser(
          adminClient,
          usersByEmail,
          row.email,
          row.fullName,
        );

        const updatedAuth = await adminClient.auth.admin.updateUserById(authUser.id, {
          email: row.email,
          user_metadata: { full_name: row.fullName },
          email_confirm: true,
        });

        if (updatedAuth.error) {
          throw new Error(updatedAuth.error.message);
        }

        const { error: profileError } = await adminClient.from("user_profiles").upsert(
          {
            id: authUser.id,
            email: row.email,
            full_name: row.fullName,
            role: row.role,
            is_active: true,
            program_year: row.programYear,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (authUser.created) {
          createdCount += 1;
        } else {
          linkedCount += 1;
        }
      } catch {
        failedCount += 1;
      }
    }
  } catch (error) {
    importErrorMessage = error?.message || "Bulk import failed.";
  }

  if (importErrorMessage) {
    redirect(usersPageUrl(selectedYear, { error: importErrorMessage }));
  }

  redirect(
    usersPageUrl(selectedYear, {
      imported: "1",
      created_count: createdCount,
      linked_count: linkedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
    }),
  );
}

async function updateProgramUser(formData) {
  "use server";

  const { user, profile } = await requireUser(["admin"]);
  const userId = String(formData.get("id") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const role = String(formData.get("role") || "")
    .trim()
    .toLowerCase();
  const isActive = formData.get("is_active") === "on";
  const selectedYear = parseProgramYear(formData.get("program_year"), profile.program_year);

  if (!userId || !fullName || !email || !role) {
    redirect(usersPageUrl(selectedYear, { error: "All edit fields are required." }));
  }

  if (!isValidEmail(email)) {
    redirect(usersPageUrl(selectedYear, { error: "Enter a valid email address." }));
  }

  if (!ROLES.includes(role)) {
    redirect(usersPageUrl(selectedYear, { error: "Invalid role." }));
  }

  const adminClient = createAdminSupabaseClient();
  let updateErrorMessage = "";

  try {
    if (userId === user.id && !isActive) {
      throw new Error("You cannot deactivate your own admin account.");
    }

    const updatedAuth = await adminClient.auth.admin.updateUserById(userId, {
      email,
      user_metadata: { full_name: fullName },
      email_confirm: true,
    });

    if (updatedAuth.error) {
      throw new Error(updatedAuth.error.message);
    }

    const { error } = await adminClient.from("user_profiles").upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role,
        is_active: isActive,
        program_year: selectedYear,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    updateErrorMessage = error?.message || "User update failed.";
  }

  if (updateErrorMessage) {
    redirect(usersPageUrl(selectedYear, { error: updateErrorMessage }));
  }

  redirect(usersPageUrl(selectedYear, { saved: "1" }));
}

async function toggleUserActive(formData) {
  "use server";

  const { user, profile } = await requireUser(["admin"]);
  const userId = String(formData.get("id") || "").trim();
  const nextActive = String(formData.get("next_active") || "") === "1";
  const selectedYear = parseProgramYear(formData.get("year"), profile.program_year);

  if (!userId) {
    redirect(usersPageUrl(selectedYear, { error: "Missing user id." }));
  }

  if (userId === user.id && !nextActive) {
    redirect(usersPageUrl(selectedYear, { error: "You cannot deactivate your own admin account." }));
  }

  const adminClient = createAdminSupabaseClient();
  const { error } = await adminClient
    .from("user_profiles")
    .update({ is_active: nextActive })
    .eq("id", userId);

  if (error) {
    redirect(usersPageUrl(selectedYear, { error: error.message }));
  }

  redirect(usersPageUrl(selectedYear, { toggled: "1" }));
}

async function removeProgramUser(formData) {
  "use server";

  const { user, profile } = await requireUser(["admin"]);
  const userId = String(formData.get("id") || "").trim();
  const selectedYear = parseProgramYear(formData.get("year"), profile.program_year);

  if (!userId) {
    redirect(usersPageUrl(selectedYear, { error: "Missing user id." }));
  }

  if (userId === user.id) {
    redirect(usersPageUrl(selectedYear, { error: "You cannot remove your own admin account." }));
  }

  const adminClient = createAdminSupabaseClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId, true);

  if (error) {
    redirect(usersPageUrl(selectedYear, { error: error.message }));
  }

  redirect(usersPageUrl(selectedYear, { removed: "1" }));
}

async function deactivateYearUsers(formData) {
  "use server";

  const { profile } = await requireUser(["admin"]);
  const selectedYear = parseProgramYear(formData.get("program_year"), profile.program_year);
  const adminClient = createAdminSupabaseClient();

  const { data, error } = await adminClient
    .from("user_profiles")
    .update({ is_active: false })
    .eq("program_year", selectedYear)
    .eq("is_active", true)
    .neq("role", "admin")
    .select("id");

  if (error) {
    redirect(usersPageUrl(selectedYear, { error: error.message }));
  }

  redirect(usersPageUrl(selectedYear, { deactivated: "1", count: data?.length || 0 }));
}

export const metadata = {
  title: "Admin Users",
};

export default async function AdminUsersPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const { supabase, profile } = await requireUser(["admin"]);
  const selectedYear = parseProgramYear(params?.year, profile.program_year);
  const alert = alertFromParams(params || {});

  const [profilesResponse, yearsResponse] = await Promise.all([
    getUserProfiles(supabase, selectedYear),
    supabase
      .from("user_profiles")
      .select("program_year")
      .order("program_year", { ascending: false }),
  ]);

  const profiles = profilesResponse.data || [];
  const error = profilesResponse.error;
  const years = (yearsResponse.data || []).map((entry) => entry.program_year);
  const yearOptions = getYearOptions(years, selectedYear, profile.program_year);

  const totalActive = profiles.filter((entry) => entry.is_active).length;
  const editingId = String(params?.edit || "").trim();
  const editingUser = profiles.find((entry) => entry.id === editingId) || null;

  return (
    <>
      <section className="card">
        <h2>Roster Year</h2>
        <p className="muted">Switch the working year for user imports, edits, and deactivation.</p>
        <form method="get" className="grid-two mt-md">
          <div className="field">
            <label className="label" htmlFor="year_filter">
              Program Year
            </label>
            <select id="year_filter" name="year" className="select" defaultValue={selectedYear}>
              {yearOptions.map((year) => (
                <option value={year} key={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button button-secondary">
            Load Year
          </button>
        </form>
      </section>

      <section className="card">
        <h2>User Overview</h2>
        <p className="muted">Counts below reflect the selected year only.</p>
        <div className="grid-two mt-md">
          <article className="surface surface-pad">
            <strong>{totalActive}</strong>
            <p>Active accounts</p>
          </article>
          <article className="surface surface-pad">
            <strong>{countByRole(profiles, "student")}</strong>
            <p>Students</p>
          </article>
          <article className="surface surface-pad">
            <strong>{countByRole(profiles, "staff")}</strong>
            <p>Staff</p>
          </article>
          <article className="surface surface-pad">
            <strong>{countByRole(profiles, "admin")}</strong>
            <p>Admins</p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Add User</h2>
        <p className="muted">Create an auth account and assign a role/year in one step.</p>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <form action={createProgramUser} className="grid-two mt-md">
          <input type="hidden" name="program_year" value={selectedYear} />
          <div className="field">
            <label className="label" htmlFor="full_name">
              Full Name
            </label>
            <input id="full_name" name="full_name" className="input" required />
          </div>
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" className="input" required />
          </div>
          <div className="field">
            <label className="label" htmlFor="role">
              Role
            </label>
            <select id="role" name="role" className="select" defaultValue="student">
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="button button-primary">
            Create User
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Bulk Upload Users</h2>
        <p className="muted">
          Upload CSV with columns <code>full_name,email,role,year</code> (header optional). If year is
          blank, this page&apos;s selected year is used.
        </p>
        <p className="muted">
          <a href="/templates/torch-live-users-template.csv" className="text-link">
            Download CSV template
          </a>
        </p>
        <form action={bulkImportUsers} className="stack mt-md">
          <input type="hidden" name="program_year" value={selectedYear} />
          <div className="field">
            <label className="label" htmlFor="bulk_csv">
              Paste CSV
            </label>
            <textarea
              id="bulk_csv"
              name="bulk_csv"
              className="textarea"
              placeholder="full_name,email,role,year\nJane Example,jane@example.com,student,2026"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="bulk_file">
              Or upload CSV file
            </label>
            <input id="bulk_file" name="bulk_file" type="file" accept=".csv,text/csv" className="input" />
          </div>
          <button type="submit" className="button button-primary">
            Import Users
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Year Rollover</h2>
        <p className="muted">
          Smarter yearly pattern: keep previous years in place, deactivate student/staff accounts from
          the completed year, then import the new cohort for the next year.
        </p>
        <form action={deactivateYearUsers} className="mt-md">
          <input type="hidden" name="program_year" value={selectedYear} />
          <button type="submit" className="button button-secondary">
            Deactivate Student/Staff in {selectedYear}
          </button>
        </form>
      </section>

      {editingUser ? (
        <section className="card">
          <h2>Edit User</h2>
          <p className="muted">Update role, email, name, status, and program year.</p>
          <form action={updateProgramUser} className="grid-two mt-md">
            <input type="hidden" name="id" value={editingUser.id} />
            <div className="field">
              <label className="label" htmlFor="edit_full_name">
                Full Name
              </label>
              <input
                id="edit_full_name"
                name="full_name"
                className="input"
                defaultValue={editingUser.full_name}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="edit_email">
                Email
              </label>
              <input
                id="edit_email"
                name="email"
                type="email"
                className="input"
                defaultValue={editingUser.email}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="edit_role">
                Role
              </label>
              <select id="edit_role" name="role" className="select" defaultValue={editingUser.role}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="edit_program_year">
                Program Year
              </label>
              <input
                id="edit_program_year"
                name="program_year"
                type="number"
                className="input"
                min={MIN_YEAR}
                max={MAX_YEAR}
                defaultValue={editingUser.program_year}
                required
              />
            </div>
            <label className="inline-check muted">
              <input type="checkbox" name="is_active" defaultChecked={editingUser.is_active} />
              Active account
            </label>
            <button type="submit" className="button button-primary">
              Save Changes
            </button>
          </form>
          <p className="muted mt-sm">
            <Link href={usersPageUrl(selectedYear)}>Done editing</Link>
          </p>
        </section>
      ) : null}

      <section className="card">
        <h2>Current Year Roster</h2>
        <p className="muted">Edit, deactivate, or remove accounts for year {selectedYear}.</p>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : profiles.length === 0 ? (
          <p className="empty">No users loaded for {selectedYear}.</p>
        ) : (
          <>
            <div className="user-card-list mobile-only mt-md">
              {profiles.map((entry) => (
                <article key={entry.id} className="user-card">
                  <div className="user-card-header">
                    <div>
                      <p className="user-card-name">{entry.full_name}</p>
                      <p className="user-card-email">{entry.email}</p>
                    </div>
                    <span className={`pill ${rolePillClass(entry.role)}`}>{entry.role}</span>
                  </div>
                  <p className="user-card-meta">
                    <span className="schedule-label">Status:</span>{" "}
                    <span className={`status-pill ${entry.is_active ? "status-pill-good" : "status-pill-warn"}`}>
                      {entry.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p className="user-card-meta">
                    <span className="schedule-label">Year:</span> {entry.program_year}
                  </p>
                  <div className="stack-sm mt-sm">
                    <Link href={usersPageUrl(selectedYear, { edit: entry.id })} className="day-tab">
                      Edit
                    </Link>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="year" value={selectedYear} />
                      <input type="hidden" name="next_active" value={entry.is_active ? "0" : "1"} />
                      <button type="submit" className="button button-ghost">
                        {entry.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <form action={removeProgramUser}>
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="year" value={selectedYear} />
                      <button type="submit" className="button button-secondary">
                        Remove
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-wrap mt-md desktop-only">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.full_name}</td>
                      <td>{entry.email}</td>
                      <td>{entry.role}</td>
                      <td>{entry.is_active ? "Active" : "Inactive"}</td>
                      <td>{entry.program_year}</td>
                      <td>
                        <div className="stack-sm">
                          <Link href={usersPageUrl(selectedYear, { edit: entry.id })} className="day-tab">
                            Edit
                          </Link>
                          <form action={toggleUserActive}>
                            <input type="hidden" name="id" value={entry.id} />
                            <input type="hidden" name="year" value={selectedYear} />
                            <input type="hidden" name="next_active" value={entry.is_active ? "0" : "1"} />
                            <button type="submit" className="button button-ghost">
                              {entry.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </form>
                          <form action={removeProgramUser}>
                            <input type="hidden" name="id" value={entry.id} />
                            <input type="hidden" name="year" value={selectedYear} />
                            <button type="submit" className="button button-secondary">
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
