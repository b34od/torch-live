const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizePhoneNumber(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  return E164_PATTERN.test(text) ? text : null;
}

export function parseCustomRecipientsInput(value) {
  return [...new Set(
    String(value || "")
      .split(/[\n,]/)
      .map((token) => token.trim())
      .filter(Boolean),
  )];
}

export function shouldSendSmsForMessageType(messageType) {
  return ["urgent", "schedule_change"].includes(String(messageType || "").trim().toLowerCase());
}

async function resolveCustomEmailPhones(supabase, programYear, emails) {
  if (!emails.length) return [];

  const { data, error } = await supabase
    .from("user_profiles")
    .select("email, phone_number")
    .eq("program_year", programYear)
    .eq("role", "student")
    .eq("is_active", true)
    .in("email", emails);

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((entry) => normalizePhoneNumber(entry.phone_number))
    .filter(Boolean);
}

export async function resolveSmsRecipients({
  supabase,
  programYear,
  recipientScope,
  recipientCohort,
  customRecipients,
}) {
  const scope = String(recipientScope || "all_students").trim().toLowerCase();

  if (scope === "custom") {
    const directPhones = [];
    const customEmails = [];

    (customRecipients || []).forEach((entry) => {
      const normalizedPhone = normalizePhoneNumber(entry);
      if (normalizedPhone) {
        directPhones.push(normalizedPhone);
        return;
      }
      const email = normalizeEmail(entry);
      if (email && email.includes("@")) {
        customEmails.push(email);
      }
    });

    const emailPhones = await resolveCustomEmailPhones(supabase, programYear, customEmails);
    return [...new Set([...directPhones, ...emailPhones])];
  }

  let query = supabase
    .from("user_profiles")
    .select("phone_number")
    .eq("program_year", programYear)
    .eq("role", "student")
    .eq("is_active", true);

  if (scope === "cohort") {
    query = query.eq("team_key", String(recipientCohort || "").trim().toLowerCase());
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data || []).map((entry) => normalizePhoneNumber(entry.phone_number)).filter(Boolean))];
}

async function sendTwilioSms({ to, body }) {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const fromNumber = String(process.env.TWILIO_FROM_NUMBER || "").trim();
  const messagingServiceSid = String(process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();

  if (!accountSid || !authToken) {
    return { sent: false, error: "TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured." };
  }

  if (!fromNumber && !messagingServiceSid) {
    return { sent: false, error: "Set TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID." };
  }

  const params = new URLSearchParams();
  params.set("To", to);
  params.set("Body", body);
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else {
    params.set("From", fromNumber);
  }

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      sent: false,
      error: String(json?.message || `Twilio request failed with status ${response.status}.`),
      code: json?.code,
    };
  }

  return {
    sent: true,
    sid: json?.sid || null,
  };
}

export async function dispatchAnnouncementSms({
  supabase,
  announcement,
  createdBy,
}) {
  const recipients = await resolveSmsRecipients({
    supabase,
    programYear: announcement.program_year,
    recipientScope: announcement.recipient_scope,
    recipientCohort: announcement.recipient_cohort,
    customRecipients: announcement.custom_recipients || [],
  });

  if (!recipients.length) {
    return {
      sentCount: 0,
      failedCount: 0,
      status: "failed",
      error: "No SMS recipients found for this scope. Add phone numbers in /admin/users or use custom recipient phones.",
    };
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const phone of recipients) {
    const result = await sendTwilioSms({
      to: phone,
      body: `${announcement.title}\n\n${announcement.body}`,
    });

    if (result.sent) {
      sentCount += 1;
      await supabase.from("notification_deliveries").insert({
        announcement_id: announcement.id,
        channel: "sms",
        recipient: phone,
        status: "sent",
        provider_message_id: result.sid,
        created_by: createdBy,
      });
      continue;
    }

    failedCount += 1;
    await supabase.from("notification_deliveries").insert({
      announcement_id: announcement.id,
      channel: "sms",
      recipient: phone,
      status: "failed",
      provider_error: result.error,
      created_by: createdBy,
    });
  }

  if (sentCount > 0 && failedCount === 0) {
    return { sentCount, failedCount, status: "sent", error: null };
  }

  if (sentCount > 0 && failedCount > 0) {
    return { sentCount, failedCount, status: "partial", error: null };
  }

  return {
    sentCount,
    failedCount,
    status: "failed",
    error: "SMS delivery failed for all recipients. Verify Twilio credentials and recipient phone numbers.",
  };
}
