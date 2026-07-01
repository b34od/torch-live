import Link from "next/link";
import { redirect } from "next/navigation";
import ConfirmSubmitButton from "../../../components/ui/ConfirmSubmitButton";
import { requireUser } from "../../../lib/auth";
import { formatDateTime, getAnnouncements } from "../../../lib/data";
import {
  dispatchAnnouncementSms,
  parseCustomRecipientsInput,
  shouldSendSmsForMessageType,
} from "../../../lib/notifications";

const AUDIENCES = ["all", "staff", "students"];
const MESSAGE_TYPES = ["info", "schedule_change", "urgent"];
const RECIPIENT_SCOPES = ["all_students", "cohort", "custom"];

function announcementsPageUrl(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `/admin/announcements?${query}` : "/admin/announcements";
}

function alertFromParams(params) {
  if (params?.sent === "1") {
    const smsStatus = String(params?.sms_status || "");
    const sentCount = Number(params?.sms_sent || 0);
    const failedCount = Number(params?.sms_failed || 0);
    if (smsStatus === "sent") {
      return {
        className: "alert alert-success",
        text: `Announcement published. SMS sent to ${sentCount} recipient${sentCount === 1 ? "" : "s"}.`,
      };
    }
    if (smsStatus === "partial") {
      return {
        className: "alert alert-error",
        text: `Announcement published. SMS sent to ${sentCount}; failed for ${failedCount}.`,
      };
    }
    if (smsStatus === "failed") {
      return {
        className: "alert alert-error",
        text: "Announcement published, but SMS delivery failed. Check phone numbers and SMS settings.",
      };
    }
    return { className: "alert alert-success", text: "Announcement published." };
  }
  if (params?.updated === "1") {
    const smsStatus = String(params?.sms_status || "");
    const sentCount = Number(params?.sms_sent || 0);
    const failedCount = Number(params?.sms_failed || 0);
    if (smsStatus === "sent") {
      return {
        className: "alert alert-success",
        text: `Announcement updated. SMS sent to ${sentCount} recipient${sentCount === 1 ? "" : "s"}.`,
      };
    }
    if (smsStatus === "partial") {
      return {
        className: "alert alert-error",
        text: `Announcement updated. SMS sent to ${sentCount}; failed for ${failedCount}.`,
      };
    }
    if (smsStatus === "failed") {
      return {
        className: "alert alert-error",
        text: "Announcement updated, but SMS delivery failed. Check phone numbers and SMS settings.",
      };
    }
    return { className: "alert alert-success", text: "Announcement updated." };
  }
  if (params?.removed === "1") {
    return { className: "alert alert-success", text: "Announcement removed." };
  }
  if (params?.error) {
    return { className: "alert alert-error", text: params.error };
  }
  return null;
}

async function createAnnouncement(formData) {
  "use server";

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = String(formData.get("audience") || "all");
  const messageType = String(formData.get("message_type") || "info").trim().toLowerCase();
  const recipientScope = String(formData.get("recipient_scope") || "all_students").trim().toLowerCase();
  const recipientCohort = String(formData.get("recipient_cohort") || "")
    .trim()
    .toLowerCase();
  const customRecipientText = String(formData.get("custom_recipients") || "");
  const customRecipients = parseCustomRecipientsInput(customRecipientText);
  const isPush = formData.get("is_push") === "on";
  const isPinned = formData.get("is_pinned") === "on";
  const sendSmsRequested = formData.get("send_sms") === "on";

  if (!title || !body) {
    redirect(announcementsPageUrl({ error: "Title and body are required." }));
  }

  if (!AUDIENCES.includes(audience)) {
    redirect(announcementsPageUrl({ error: "Invalid audience." }));
  }
  if (!MESSAGE_TYPES.includes(messageType)) {
    redirect(announcementsPageUrl({ error: "Invalid message type." }));
  }
  if (!RECIPIENT_SCOPES.includes(recipientScope)) {
    redirect(announcementsPageUrl({ error: "Invalid recipient scope." }));
  }
  if (audience !== "students" && audience !== "all") {
    redirect(announcementsPageUrl({ error: "Recipient scope requires audience to include students." }));
  }
  if (recipientScope === "cohort" && !recipientCohort) {
    redirect(announcementsPageUrl({ error: "Team scope requires a team key." }));
  }
  if (recipientScope === "custom" && customRecipients.length === 0) {
    redirect(announcementsPageUrl({ error: "Custom scope requires at least one recipient token." }));
  }
  if (sendSmsRequested && !shouldSendSmsForMessageType(messageType)) {
    redirect(
      announcementsPageUrl({
        error: "SMS is allowed only for urgent and schedule_change messages.",
      }),
    );
  }

  const { supabase, profile, user } = await requireUser(["admin"]);
  const recentCutoff = new Date(Date.now() - 60 * 1000).toISOString();
  const { data: duplicateRows } = await supabase
    .from("announcements")
    .select("id")
    .eq("program_year", profile.program_year)
    .eq("title", title)
    .eq("body", body)
    .eq("audience", audience)
    .gte("created_at", recentCutoff)
    .limit(1);

  if (duplicateRows?.length) {
    redirect(announcementsPageUrl({ error: "Duplicate detected within 60 seconds." }));
  }

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      program_year: profile.program_year,
      title,
      body,
      audience,
      message_type: messageType,
      recipient_scope: recipientScope,
      recipient_cohort: recipientScope === "cohort" ? recipientCohort : null,
      custom_recipients: recipientScope === "custom" ? customRecipients : [],
      send_sms: sendSmsRequested,
      sms_delivery_status: sendSmsRequested ? "queued" : "not_requested",
      is_push: isPush,
      is_pinned: isPinned,
      created_by: user.id,
    })
    .select(
      "id, program_year, title, body, message_type, recipient_scope, recipient_cohort, custom_recipients, send_sms",
    )
    .single();

  if (error || !announcement) {
    redirect(announcementsPageUrl({ error: error?.message || "Failed to create announcement." }));
  }

  await supabase.from("notification_deliveries").insert({
    announcement_id: announcement.id,
    channel: "in_app",
    status: "sent",
    created_by: user.id,
  });

  if (!sendSmsRequested) {
    redirect(announcementsPageUrl({ sent: "1" }));
  }

  const smsResult = await dispatchAnnouncementSms({
    supabase,
    announcement,
    createdBy: user.id,
  });

  await supabase
    .from("announcements")
    .update({ sms_delivery_status: smsResult.status })
    .eq("id", announcement.id);

  redirect(
    announcementsPageUrl({
      sent: "1",
      sms_status: smsResult.status,
      sms_sent: smsResult.sentCount || 0,
      sms_failed: smsResult.failedCount || 0,
    }),
  );
}

async function updateAnnouncement(formData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const audience = String(formData.get("audience") || "all");
  const messageType = String(formData.get("message_type") || "info").trim().toLowerCase();
  const recipientScope = String(formData.get("recipient_scope") || "all_students").trim().toLowerCase();
  const recipientCohort = String(formData.get("recipient_cohort") || "")
    .trim()
    .toLowerCase();
  const customRecipients = parseCustomRecipientsInput(formData.get("custom_recipients"));
  const isPush = formData.get("is_push") === "on";
  const isPinned = formData.get("is_pinned") === "on";
  const sendSmsRequested = formData.get("send_sms") === "on";

  if (!id) {
    redirect(announcementsPageUrl({ error: "Missing announcement id." }));
  }
  if (!title || !body) {
    redirect(announcementsPageUrl({ error: "Title and body are required.", edit: id }));
  }
  if (!AUDIENCES.includes(audience)) {
    redirect(announcementsPageUrl({ error: "Invalid audience.", edit: id }));
  }
  if (!MESSAGE_TYPES.includes(messageType)) {
    redirect(announcementsPageUrl({ error: "Invalid message type.", edit: id }));
  }
  if (!RECIPIENT_SCOPES.includes(recipientScope)) {
    redirect(announcementsPageUrl({ error: "Invalid recipient scope.", edit: id }));
  }
  if (audience !== "students" && audience !== "all") {
    redirect(
      announcementsPageUrl({
        error: "Recipient scope requires audience to include students.",
        edit: id,
      }),
    );
  }
  if (recipientScope === "cohort" && !recipientCohort) {
    redirect(announcementsPageUrl({ error: "Team scope requires a team key.", edit: id }));
  }
  if (recipientScope === "custom" && customRecipients.length === 0) {
    redirect(announcementsPageUrl({ error: "Custom scope requires recipients.", edit: id }));
  }
  if (sendSmsRequested && !shouldSendSmsForMessageType(messageType)) {
    redirect(
      announcementsPageUrl({
        error: "SMS is allowed only for urgent and schedule_change messages.",
        edit: id,
      }),
    );
  }

  const { supabase, profile, user } = await requireUser(["admin"]);
  const { data: announcement, error } = await supabase
    .from("announcements")
    .update({
      title,
      body,
      audience,
      message_type: messageType,
      recipient_scope: recipientScope,
      recipient_cohort: recipientScope === "cohort" ? recipientCohort : null,
      custom_recipients: recipientScope === "custom" ? customRecipients : [],
      send_sms: sendSmsRequested,
      sms_delivery_status: sendSmsRequested ? "queued" : "not_requested",
      is_push: isPush,
      is_pinned: isPinned,
    })
    .eq("id", id)
    .eq("program_year", profile.program_year)
    .select(
      "id, program_year, title, body, message_type, recipient_scope, recipient_cohort, custom_recipients, send_sms",
    )
    .single();

  if (error || !announcement) {
    redirect(announcementsPageUrl({ error: error?.message || "Failed to update announcement.", edit: id }));
  }

  if (!sendSmsRequested) {
    redirect(announcementsPageUrl({ updated: "1" }));
  }

  const smsResult = await dispatchAnnouncementSms({
    supabase,
    announcement,
    createdBy: user.id,
  });

  await supabase
    .from("announcements")
    .update({ sms_delivery_status: smsResult.status })
    .eq("id", announcement.id);

  redirect(
    announcementsPageUrl({
      updated: "1",
      sms_status: smsResult.status,
      sms_sent: smsResult.sentCount || 0,
      sms_failed: smsResult.failedCount || 0,
    }),
  );
}

async function removeAnnouncement(formData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect(announcementsPageUrl({ error: "Missing announcement id." }));
  }

  const { supabase, profile } = await requireUser(["admin"]);
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("program_year", profile.program_year);

  if (error) {
    redirect(announcementsPageUrl({ error: error.message }));
  }

  redirect(announcementsPageUrl({ removed: "1" }));
}

export const metadata = {
  title: "Admin Announcements",
};

export default async function AdminAnnouncementsPage({ searchParams }) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const alert = alertFromParams(params || {});
  const { supabase, profile } = await requireUser(["admin"]);
  const { data: announcements, error } = await getAnnouncements(supabase, profile.program_year, 30);
  const editingId = String(params?.edit || "").trim();
  const editingAnnouncement = announcements.find((entry) => entry.id === editingId) || null;
  const editingCustomRecipients = (editingAnnouncement?.custom_recipients || []).join("\n");

  return (
    <>
      <section className="card">
        <h2>{editingAnnouncement ? "Edit Announcement" : "Send Announcement"}</h2>
        {alert ? <p className={alert.className}>{alert.text}</p> : null}
        <form action={editingAnnouncement ? updateAnnouncement : createAnnouncement} className="stack">
          {editingAnnouncement ? <input type="hidden" name="id" value={editingAnnouncement.id} /> : null}
          <div className="field">
            <label htmlFor="title" className="label">
              Title
            </label>
            <input
              id="title"
              name="title"
              className="input"
              defaultValue={editingAnnouncement?.title || ""}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="body" className="label">
              Body
            </label>
            <textarea
              id="body"
              name="body"
              className="textarea"
              defaultValue={editingAnnouncement?.body || ""}
              required
            />
          </div>
          <div className="grid-two">
            <div className="field">
              <label htmlFor="audience" className="label">
                Audience
              </label>
              <select
                id="audience"
                name="audience"
                className="select"
                defaultValue={editingAnnouncement?.audience || "all"}
              >
                <option value="all">All</option>
                <option value="staff">Staff only</option>
                <option value="students">Students only</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="message_type" className="label">
                Message Type
              </label>
              <select
                id="message_type"
                name="message_type"
                className="select"
                defaultValue={editingAnnouncement?.message_type || "info"}
              >
                <option value="info">Info</option>
                <option value="schedule_change">Schedule Change</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid-two">
            <div className="field">
              <label htmlFor="recipient_scope" className="label">
                Recipient Scope
              </label>
              <select
                id="recipient_scope"
                name="recipient_scope"
                className="select"
                defaultValue={editingAnnouncement?.recipient_scope || "all_students"}
              >
                <option value="all_students">All Students</option>
                <option value="cohort">Single Team</option>
                <option value="custom">Custom List</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="recipient_cohort" className="label">
                Team Key (for single team scope)
              </label>
              <input
                id="recipient_cohort"
                name="recipient_cohort"
                className="input"
                defaultValue={editingAnnouncement?.recipient_cohort || ""}
                placeholder="team-1"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="custom_recipients" className="label">
              Custom Recipients (phones or student emails)
            </label>
            <textarea
              id="custom_recipients"
              name="custom_recipients"
              className="textarea"
              defaultValue={editingCustomRecipients}
              placeholder={"+16095551234\nstudent1@example.com"}
            />
            <p className="muted">
              Used when scope is set to <strong>Custom List</strong>. One token per line or comma-separated.
            </p>
          </div>
          <div className="grid-two">
            <div className="stack-sm align-end">
              <label>
                <input type="checkbox" name="is_push" defaultChecked={Boolean(editingAnnouncement?.is_push)} />{" "}
                Mark as push-eligible
              </label>
              <label>
                <input
                  type="checkbox"
                  name="send_sms"
                  defaultChecked={Boolean(editingAnnouncement?.send_sms)}
                />{" "}
                Send SMS now (urgent/schedule_change only)
              </label>
              <label>
                <input
                  type="checkbox"
                  name="is_pinned"
                  defaultChecked={Boolean(editingAnnouncement?.is_pinned)}
                />{" "}
                Pin to top
              </label>
            </div>
          </div>
          <button type="submit" className="button button-primary">
            {editingAnnouncement ? "Save Announcement" : "Publish Announcement"}
          </button>
        </form>
        {editingAnnouncement ? (
          <p className="muted mt-sm">
            <Link href={announcementsPageUrl()}>Done editing</Link>
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Recent Announcements</h2>
        {error ? (
          <p className="alert alert-error">{error.message}</p>
        ) : announcements.length === 0 ? (
          <p className="empty">No announcements yet.</p>
        ) : (
          <div className="stack">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="resource-item">
                <strong>{announcement.title}</strong>
                <p>{announcement.body}</p>
                <div className="announcement-meta">
                  <span className="pill pill-staff">{announcement.audience}</span>
                  {announcement.is_pinned ? <span className="pill pill-admin">Pinned</span> : null}
                  {announcement.is_push ? <span className="pill pill-staff">Push</span> : null}
                  <span className="pill pill-admin">{announcement.message_type || "info"}</span>
                  <span className="pill pill-staff">{announcement.recipient_scope || "all_students"}</span>
                  {announcement.recipient_scope === "cohort" && announcement.recipient_cohort ? (
                    <span className="pill pill-admin">{announcement.recipient_cohort}</span>
                  ) : null}
                  {announcement.recipient_scope === "custom" ? (
                    <span className="pill pill-admin">
                      custom {Array.isArray(announcement.custom_recipients) ? announcement.custom_recipients.length : 0}
                    </span>
                  ) : null}
                  {announcement.send_sms ? (
                    <span className="pill pill-staff">SMS {announcement.sms_delivery_status}</span>
                  ) : null}
                  <span className="muted">{formatDateTime(announcement.created_at)}</span>
                </div>
                <div className="item-actions mt-sm">
                  <Link href={announcementsPageUrl({ edit: announcement.id })} className="day-tab">
                    Edit
                  </Link>
                  <form action={removeAnnouncement}>
                    <input type="hidden" name="id" value={announcement.id} />
                    <ConfirmSubmitButton
                      label="Remove"
                      className="button button-secondary"
                      confirmMessage="Remove this announcement?"
                    />
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
