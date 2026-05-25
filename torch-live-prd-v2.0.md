# TORCH Live — Product Requirements Document

**Product Name:** TORCH Live
**Version:** 2.0 (Final Draft)
**Author:** Bryan O'Donnell / Claude
**Date:** May 25, 2026
**Status:** Build-Ready with Gates (Pre-Build Review Complete)

---

## 1. Executive Summary

### What It Is

TORCH Live is a mobile-first progressive web app (PWA) that serves as the operational hub during the annual Torch Leadership Academy (TORCH) conference at Stockton University. It replaces printed schedules, group texts, and verbal announcements with a single source of truth for ~200 participants.

**URL:** `live.torchleadershipacademy.org`
**Platform:** PWA — installed to home screen, works like a native app, no App Store required
**Timeline:** MVP ready for staff testing at July 17 move-in day

### The Problem

During a 4-day residential program with ~100 high school students and ~40 staff, schedule changes happen constantly — rain moves activities indoors, sessions run long, rooms change. Today, updates flow through word-of-mouth, group texts on Band, and reprinted paper schedules. Students miss sessions. Staff scramble to relay changes. The information layer is fragile precisely when the program needs it most.

### What It Does (Three Things, Very Well)

1. **Live Schedules** — Two fully independent schedules: a staff schedule with full operational detail, and a curated student schedule that preserves surprises and simplifies what kids need to know. Both update in real time when admins publish changes.

2. **Notifications** — One-way communications from admin to participants. Urgent changes can trigger push notifications (opt-in). General announcements live in-app. Targetable by audience (all, staff-only, students-only).

3. **Resources** — A living reference section with campus map, emergency contacts, FAQ, and program info. Mostly pre-loaded, editable during the event.

### Success Criteria

- 90%+ of participants actively use the app during the program
- Schedule changes reach all connected users within 60 seconds (p95)
- Zero instances of "I didn't know where to go" attributable to information gaps
- Admin team can manage everything without technical assistance
- Reusable for TORCH 2027+ with fresh data
- 95% of primary screens load in under 2 seconds on campus wifi
- WCAG 2.1 AA baseline met on core flows (login, now, schedule, updates, resources)

---

## 2. Why PWA, Not a Native App

A native iOS/Android app would require App Store enrollment ($99/year), a review process (1–7 days, possible rejection), two codebases (or React Native complexity), and every participant downloading from an app store. For a 4-day event with 200 users and a 7-week build timeline, that's the wrong trade-off.

A PWA delivers:
- **One URL, every device.** Students open `live.torchleadershipacademy.org` in their browser.
- **Home screen icon.** "Add to Home Screen" makes it look and feel native — full screen, TORCH logo, no browser bar.
- **Offline support.** Service worker caches schedule and resources for spotty wifi.
- **Push notifications.** Supported on Android and iOS 16.4+ (opt-in, not critical path).
- **One codebase.** Ships in weeks, not months.

---

## 3. Users & Roles

### 3.1 Student (Learner)

**Who:** ~100 high school students, ages 14–18. Personal phones (iOS/Android). First time at Stockton campus.

**What they see:**
- Student schedule: clean daily timeline (time, activity, location)
- Surprise sessions show curated names ("Special Activity" not "Board Breaking")
- "What's happening now?" at a glance
- Announcements (all + student-targeted)
- Resources & FAQ

**What they can do:** View only. No editing, posting, or messaging.

**Primary job:** "Where am I supposed to be right now?"

### 3.2 Staff (Counselor / Advisor)

**Who:** ~40 staff across role types (Lead Counselors, Senior Counselors, Support Counselors, Team Advisors, Non-Team Advisors, Production).

**What they see:**
- Full staff schedule with point person, location, rain location, notes, A/V needs
- All session names (no spoiler protection)
- All announcements (including staff-only)
- All resources (including staff-specific like MEMs, crisis protocols)

**What they can do:** View only.

**Primary job:** "What's my assignment and who's the point person?"

### 3.3 Admin

**Who:** Bryan O'Donnell, Natalie De Rosa, Ben Jones, Caroline, and possibly Danes (~5 people).

**What they see:** Everything staff sees + admin panel.

**What they can do:**
- Edit both schedules independently
- Compose and send announcements (with optional push)
- Manage user accounts (import, edit roles, resend magic links)
- Edit resources and FAQ
- Toggle rain plan
- View basic login stats

**Primary job:** "It's raining — flip 3 sessions to indoor locations and tell everyone NOW."

---

## 4. Features — Prioritized

### P0: Must Have for MVP (July 17)

#### F1: Magic Link Authentication

Users sign in via email. No passwords. Supabase Auth handles this natively.

**Flow:**
1. Admin bulk-imports users (name, email, role) before the program
2. User opens `live.torchleadershipacademy.org` on phone
3. Enters email
4. Receives magic link email
5. Taps link → signed in (session persists 7 days)

**Requirements:**
- Session duration: 7 days (covers full program cycle)
- Role assigned by admin during import, not self-selected
- No self-registration — admin creates all accounts
- "Resend link" button on login screen
- Rate limiting on requests
- Email deliverability: start with Supabase default SMTP; upgrade to custom SMTP via Mailchimp/Resend only if spam filtering is an issue during testing

**Edge cases:**
- Email not received → FAQ entry about checking spam + resend option
- Shared device → sign-out available but not prominent
- Student uses wrong email → admin can update and resend

**Onboarding (first login):**
- After first successful login, show "Add to Home Screen" guide with device-specific instructions (iOS: Share → Add to Home Screen; Android: menu → Install App)
- One-time notification permission prompt (not blocking — user can skip)

#### F2: Two Independent Schedules

The staff schedule and student schedule are separate data sets, managed independently. They are NOT filtered views of the same data.

**Why separate:** Staff schedules include setup blocks, concurrent sessions, and operational items that don't map to anything on the student side. The student schedule is a curated experience — some sessions are renamed to preserve surprises (board breaking, adventure course, Monday night dance). Forcing a 1:1 relationship creates false constraints.

**Student Schedule View:**
- Clean daily timeline: Time → Activity → Location
- "Now" indicator highlights current time block
- "Next up" card always visible
- Day selector tabs (Day 1 / Day 2 / Day 3 / Day 4)
- Pull-to-refresh
- Cached for offline

**Staff Schedule View:**
- Full daily timeline: Time → Activity → Duration → Location → Rain Location → Point Person → Secondary → Notes → A/V Needs
- Expandable rows for long notes
- Same "Now" indicator and day tabs
- Cached for offline

**Admin Schedule Editor (separate for each schedule):**
- Select which schedule to edit (Student or Staff)
- Add / edit / delete / reorder items
- Inline editing of all fields
- "Publish" to push changes live
- Preview before publishing
- Change log (who edited what, when)

**Data Model:**
```sql
-- Staff schedule: full operational detail
staff_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_year INT NOT NULL DEFAULT 2026,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 4),
  start_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  activity_name TEXT NOT NULL,
  location TEXT,
  rain_location TEXT,
  is_rain_active BOOLEAN DEFAULT FALSE,
  point_person TEXT,
  secondary_person TEXT,
  notes TEXT,
  av_needs TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Student schedule: curated, surprise-safe
student_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_year INT NOT NULL DEFAULT 2026,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 4),
  start_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  activity_name TEXT NOT NULL,  -- curated name, may hide surprises
  location TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

#### F3: Notifications & Announcements

Two tiers of communication, both one-way from admin:

**Tier 1 — Push Notifications (Opt-in, Not Critical Path)**
- Browser-level notifications via Web Push API
- For urgent schedule changes and emergency info
- Users who don't enable push still see everything in-app
- Targetable: all / staff-only / students-only

**Tier 2 — In-App Announcements (Primary Channel)**
- Feed within the app, newest first
- Unread badge indicator
- Admin composes title + body + audience
- Can pin important announcements to top
- No character limit
- De-duplication guard: prevent accidental duplicate sends within 60 seconds unless explicitly confirmed by admin
- Endpoint guardrails: announcement send endpoint rate-limited and idempotency-key aware for repeated submit attempts

**Data Model:**
```sql
announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_year INT NOT NULL DEFAULT 2026,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'staff', 'students')),
  is_push BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id),
  user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
```

#### F4: Resources & FAQ

Structured reference section with admin-editable categories and items.

**Default categories:**
- Emergency & Safety (contacts, crisis protocol, medical)
- Campus Map (static image from Stockton PDF)
- Daily Life (meals, wifi, laundry, housing)
- Program Info (teams, overview, what to bring)
- FAQ (expandable Q&A format)

**Requirements:**
- Admin can add/edit/reorder categories and items
- Per-item visibility: all / staff-only / students-only
- Markdown support for body text (sanitized allowlist only; no raw HTML/script execution)
- Optional image per item (stored in Supabase Storage)
- Cached for offline

**Data Model:**
```sql
resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_year INT NOT NULL DEFAULT 2026,
  name TEXT NOT NULL,
  icon TEXT,  -- emoji or icon name
  sort_order INT NOT NULL DEFAULT 0
);

resource_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES resource_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,  -- markdown
  image_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'staff', 'students')),
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### F5: User Management (Admin)

- Bulk CSV import: name, email, role (student/staff/admin)
- Individual add / edit / deactivate
- Resend magic link for specific users
- View who's logged in (active sessions)
- Year-over-year: archive previous year, import fresh list

**Data Model:**
```sql
user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  program_year INT NOT NULL DEFAULT 2026,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log for admin actions
audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### F6: Offline Support (PWA)

- PWA manifest with TORCH branding (icon, name, colors)
- Service worker caches: app shell, current schedule data, resources, last 20 announcements
- Offline indicator: "📡 Offline — last updated X minutes ago"
- Auto-sync on reconnection with toast if data changed
- IndexedDB for structured data cache

### P1: Should Have (if time before July 17)

#### F7: "Now" Dashboard
- Default landing screen after login
- Current time block, next session, latest announcement
- Auto-advances as time passes

#### F8: Rain Plan Toggle
- Admin toggle that flips all staff schedule items to rain locations
- Visual indicator when active (☔)
- Reversible

#### F9: Basic Analytics
- Active user count
- Login rate by role
- Announcement read rates

### 4.5 MVP Definition of Done (Build Gate)

All items below must pass before Day 1 go-live:

- Auth and role routing: student, staff, and admin users land in correct views with no cross-role leakage
- Schedule publish latency: admin publish to client-visible update <= 60s (p95)
- Offline behavior: app displays last-known schedule/resources and clearly shows staleness timestamp
- Announcement reliability: in-app feed is authoritative even when push fails
- Admin recoverability: accidental edits can be identified via audit log and corrected quickly
- Accessibility: keyboard navigation, visible focus states, contrast, and screen-reader labels pass baseline audit
- Security checks: RLS policy tests pass for positive and negative authorization cases

### P2: Could Have (TORCH 2027+)

#### F10: Team-specific schedule details
#### F11: Interactive campus map
#### F12: Staff role-specific notes (Lead vs SrC vs Support views)

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  STUDENT & STAFF PHONES                   │
│               live.torchleadershipacademy.org              │
│                    (PWA on home screen)                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL (live.torchleadershipacademy.org)      │
│                                                          │
│   Next.js App (App Router) + Tailwind + shadcn/ui       │
│   ├── /login .............. magic link entry             │
│   ├── /student/now ........ student dashboard            │
│   ├── /student/schedule ... student schedule (4 days)    │
│   ├── /student/updates .... announcements feed           │
│   ├── /student/resources .. resources & FAQ              │
│   ├── /staff/now .......... staff dashboard              │
│   ├── /staff/schedule ..... full staff schedule          │
│   ├── /staff/updates ...... all announcements            │
│   ├── /staff/resources .... all resources                │
│   ├── /admin/schedule ..... schedule editor (2 tabs)     │
│   ├── /admin/announcements  compose & send               │
│   ├── /admin/resources .... resource editor              │
│   ├── /admin/users ........ user management & CSV import │
│   └── /admin/settings ..... rain plan, program year      │
│                                                          │
│   Service Worker: offline cache + IndexedDB              │
│   PWA Manifest: TORCH icon, colors, name                 │
└────────────────────────┬────────────────────────────────┘
                         │ Supabase JS Client
                         ▼
┌─────────────────────────────────────────────────────────┐
│                       SUPABASE                           │
│                                                          │
│   Auth ─── Magic link (default SMTP, upgrade if needed)  │
│                                                          │
│   PostgreSQL                                             │
│   ├── user_profiles                                      │
│   ├── staff_schedule_items    ← independent              │
│   ├── student_schedule_items  ← independent              │
│   ├── announcements                                      │
│   ├── announcement_reads                                 │
│   ├── resource_categories                                │
│   ├── resource_items                                     │
│   └── audit_log                                          │
│                                                          │
│   Row Level Security                                     │
│   ├── students: SELECT on student-visible data only      │
│   ├── staff: SELECT on all data                          │
│   └── admin: full CRUD                                   │
│                                                          │
│   Realtime ─── WebSocket subscriptions                   │
│   ├── schedule changes → instant client update           │
│   └── new announcements → feed refresh                   │
│                                                          │
│   Storage ─── campus map image, resource images           │
│                                                          │
│   Edge Functions                                         │
│   ├── send-push-notification (Web Push API)              │
│   └── bulk-import-users (CSV parse + auth creation)      │
└─────────────────────────────────────────────────────────┘

DNS: Squarespace → CNAME record
     live.torchleadershipacademy.org → 619e542444e1c4b9.vercel-dns-017.com
```

**Live Infrastructure:**
- Vercel: v0-torch-live-bni125s6w-b34ods-projects.vercel.app
- Supabase: cpiyowyqksmksifgpegt.supabase.co

### Row Level Security Policies

```sql
-- NOTE: RLS examples below are requirement-level pseudocode.
-- Final migrations should centralize role/year checks in a helper function
-- (e.g., app_user_role(), app_user_year()) to avoid policy drift.

-- Student schedule readable by students/staff/admin in the active program year
CREATE POLICY "read_student_schedule_by_role" ON student_schedule_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_active = TRUE
        AND up.role IN ('student', 'staff', 'admin')
        AND up.program_year = student_schedule_items.program_year
    )
  );

-- Staff schedule readable by staff/admin only in the active program year
CREATE POLICY "read_staff_schedule_by_role" ON staff_schedule_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_active = TRUE
        AND up.role IN ('staff', 'admin')
        AND up.program_year = staff_schedule_items.program_year
    )
  );

-- Admin-only writes for schedule tables
CREATE POLICY "admin_manage_student_schedule" ON student_schedule_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE)
  );

CREATE POLICY "admin_manage_staff_schedule" ON staff_schedule_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE)
  );

-- Announcements filtered by audience + program year
CREATE POLICY "read_announcements" ON announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_active = TRUE
        AND up.program_year = announcements.program_year
        AND (
          announcements.audience = 'all'
          OR (announcements.audience = 'staff' AND up.role IN ('staff', 'admin'))
          OR (announcements.audience = 'students' AND up.role = 'student')
        )
    )
  );
```

**RLS acceptance requirement:** include SQL policy tests that prove unauthorized reads/writes fail for each role and table.

---

## 6. Security & Privacy

### Authentication
- Magic link auth via Supabase (no passwords stored)
- Sessions expire after 7 days
- All access controlled by Row Level Security at the database level
- Admin actions logged in audit table

### Data Privacy (Minors)
- **Minimal data:** name, email, role. No location tracking, no analytics cookies, no third-party trackers.
- **No user-generated content.** Students cannot post, comment, message, or share. One-way broadcast only. Eliminates bullying, inappropriate content, and moderation concerns entirely.
- **No chat or messaging between users.**
- **COPPA:** All students are 14+. App collects minimal PII with no social features.
- **No third-party data sharing.** No analytics platforms, no ad networks, no social login.
- **Data retention:** Archived after each program year. Hard-delete available on request.

### Infrastructure
- HTTPS enforced by Vercel
- Database encrypted at rest (Supabase)
- API keys in environment variables only
- Supabase anon key on client (safe — RLS enforces permissions)
- Service key server-side only
- Security headers baseline required: HSTS, CSP, X-Frame-Options (or `frame-ancestors`), Referrer-Policy, X-Content-Type-Options
- Admin session revocation path must invalidate active refresh sessions immediately when an admin account is deactivated
- Backup/restore requirement: daily backup verification with documented restore drill before program week (target RPO <= 24h, RTO <= 2h)

### Event Threat Model (Pre-Build Red-Team Checklist)
- Compromised participant account: limited blast radius because participants are view-only and cannot post
- Compromised staff account: no admin writes permitted; staff remains read-only
- Compromised admin account: highest risk; require immediate session revocation + audit review workflow
- Malicious or mistaken announcement send: include confirmation step for push + audience + preview before send
- CSV poisoning or malformed import: strict schema validation, row-level error reporting, and dry-run preview required
- Excessive auth/email attempts: Supabase rate limiting + app-side cooldown on resend

### Incident Response During Program Week
- One-command admin lockout path (deactivate account + force sign-out)
- Manual fallback channel: staff verbal relay + whiteboard update protocol if app is degraded
- On-call owner each day for app operations and rollback authority

---

## 7. Design

### Principles

1. **Glanceable.** Where am I supposed to be? Answer in 3 seconds.
2. **Calm.** No gamification, no social features. A utility.
3. **TORCH-branded.** Follow official TORCH logo, typography, and color rules from the brand guide.
4. **Thumb-friendly.** Bottom nav. Large tap targets. One-hand use.
5. **Trust the role.** App knows who you are and shows the right content.

### Accessibility & UX Requirements (Must Meet for MVP)
- Touch targets minimum 44x44 px on mobile for interactive controls
- Text contrast meets WCAG 2.1 AA (4.5:1 normal text, 3:1 large text/UI components)
- Full keyboard navigation support on all core views
- Visible focus ring on every actionable element
- Semantic landmarks and labels for screen readers
- Motion preferences respected (`prefers-reduced-motion`)
- Form errors are inline, specific, and announced to assistive tech

### Navigation

**Student bottom nav:**
🏠 Now | 📅 Schedule | 📢 Updates | 📋 Resources

**Staff bottom nav:**
🏠 Now | 📅 Schedule | 📢 Updates | 📋 Resources

**Admin:** Staff views + gear icon → admin panel

### TORCH Brand in App
- **Naming language:** First reference should be "Torch Leadership Academy" where possible; abbreviation is "TORCH" (always all caps); avoid "TLA" unless absolutely necessary.
- **Primary typography:** Poppins (Black/Regular/Light and italic variants) is the default app UI type system.
- **Supporting typography:** Playfair Display (Black/Regular and italic variants) is optional for limited accent use (hero headings, quotes), not body copy.
- **Primary color palette:** coral `#ed6767`, gold `#eeb75f`, yellow `#eceb67`.
- **Secondary color palette:** purple `#713c97`, lavender `#adaed7`, green `#289a48`, lime `#93cc86`, plus neutrals `#f1f1f1`, `#d3d3d3`, `#7f8080`, `#2c2c2c`, `#ffffff`, `#000000`.
- **Logo files:** Use only official logo assets from `BRAND GUIDELINES AND LOGOS`; do not redraw, recreate, recolor, rotate, or distort.
- **Logo sizing and spacing:** Keep clear space equal to at least 1x the "O" height around the logo; primary logo minimum width on web is 150px.
- **Logo selection:** Use primary logo by default, alternate logo for constrained spaces, and the small mark for favicon/app icon use cases.

---

## 8. Data Import Strategy

### User Import
Admin uploads a CSV:
```csv
full_name,email,role
Jordan Smith,jordan.smith@email.com,student
Sarah Stefanelli,sarah@torchleadershipacademy.org,admin
Larry Johnson,larry@email.com,staff
```

System creates Supabase auth accounts and user_profiles. Magic links sent on admin's command (not automatically on import).

### Schedule Import
Two CSV templates, one per schedule.

**Student schedule CSV:**
```csv
day,start_time,duration_min,activity,location
1,09:00,45,Ice Breakers,Housing 2/3 Quad
1,09:45,5,Special Activity,Theatre
1,09:50,30,Welcome to TORCH,Theatre
1,10:20,10,Program Overview,Theatre
```

**Staff schedule CSV:**
```csv
day,start_time,duration_min,activity,location,rain_location,point_person,secondary,notes,av_needs
1,08:00,15,Staff Meeting,Outside,,,,Pep talk,
1,08:15,45,Registration Set-Up,Housing 2/3,Lot 6/7,Sarah & Josh,Meg & Mitch,,
1,09:00,0,Student Registration,Housing 2/3,,Sarah & Josh,Meg & Mitch,Backpats on doors,
1,09:00,45,Ice Breakers,Housing 2/3 Quad,Event A,SrCs,Brunt,,Mic and Speakers
1,09:45,5,TORCH Survey,Theatre,,Josh,,Pronoun pins on table,
```

**Excel converter:** A Python script will convert Bryan's existing Excel format (the MAIN_SCHEDULE_TORCH_2026.xlsx structure) into these CSVs. Bryan keeps working in the spreadsheet he already uses — export and import.

### Year-Over-Year Rollover
1. Admin sets new program year in settings
2. Previous year's data archived (read-only)
3. Option to copy last year's schedule as starting template
4. Import new user CSV
5. Update resources
6. Send fresh magic links

### 8.5 Import Boundary Validation Requirements
- CSV upload accepts only expected MIME types and max file size threshold (define exact limit in implementation)
- Strict schema validation per row with required columns, enum validation for role, and normalized time formats
- Dry-run preview required before write: show create/update/deactivate counts and row-level errors
- Reject partial writes on malformed files unless admin explicitly chooses "import valid rows only"
- Every import writes structured audit metadata (who, when, file hash, row counts, failures)

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Students don't install/check app | Medium | High | Staff reinforce at Day 1 registration. "Now" dashboard provides instant value. Add-to-home-screen onboarding. |
| Magic link emails go to spam | Low | High | Test early with real student emails. FAQ covers "check spam." Upgrade to custom SMTP if needed. |
| Wifi goes down during schedule change | Medium | High | Offline cache shows last-known schedule. Staff verbally relay urgent changes as backup. |
| Push notifications don't work on some iPhones | Medium | Low | Push is not critical path. In-app announcements are the primary channel. |
| Admin accidentally publishes wrong data | Low | Medium | Change log tracks edits. Preview before publish. |
| Scope creep delays MVP | High | High | P0 only for July 17. No team features, no interactive map, no role-specific views. |

---

## 10. Timeline

### Phase 1: Foundation (May 26 – June 8)
- [ ] Supabase project: database schema, RLS policies, auth config
- [ ] Next.js project on Vercel, connected to GitHub
- [ ] DNS: CNAME record on Squarespace → Vercel
- [ ] Magic link auth flow working end-to-end
- [ ] PWA manifest + service worker shell
- [ ] Basic admin: CSV user import
- [ ] TORCH branding: naming language, typography roles, color palettes, and logo clear-space/min-size rules

### Phase 2: Core Features (June 9 – June 22)
- [ ] Student schedule display (day tabs, now indicator)
- [ ] Staff schedule display (full detail, expandable rows)
- [ ] Admin schedule editor (both schedules, independent)
- [ ] Schedule CSV import (both formats)
- [ ] Supabase Realtime subscriptions (live updates)
- [ ] Announcements: compose, send, feed display
- [ ] Push notification opt-in flow

### Phase 3: Polish & Resources (June 23 – July 6)
- [ ] Resources & FAQ section (admin editor + display)
- [ ] Campus map (Stockton PDF → static image)
- [ ] "Now" dashboard (P1)
- [ ] Offline support (service worker caching, IndexedDB)
- [ ] Rain plan toggle (P1)
- [ ] Add-to-home-screen onboarding guide
- [ ] Mobile UX polish pass

### Phase 4: Testing & Launch (July 7 – July 17)
- [ ] Excel-to-CSV converter script
- [ ] Load real 2026 schedule data
- [ ] Import staff accounts, test with admin team
- [ ] Admin training (Bryan, Natalie, Ben, Caroline, Danes)
- [ ] Staff beta test at July 17 move-in
- [ ] Bug fixes from staff feedback
- [ ] Import student accounts
- [ ] Send magic links to all students (July 17 evening or July 18 morning)
- [ ] Go live Day 1

---

## 10.5 Pre-Launch Verification Matrix

- Auth: all role access tests pass (student/staff/admin + inactive user)
- RLS: negative tests confirm blocked access to unauthorized tables and rows
- Realtime: schedule publish appears on at least 3 test devices in <= 60s
- Offline: airplane mode test confirms last-known schedule/resources render with staleness indicator
- Notifications: push opt-in tested on iOS 16.4+ and Android; in-app feed validated as primary channel
- Import pipeline: CSV dry-run catches malformed rows without partial writes
- Accessibility: automated scan baseline (axe) + manual screen reader smoke test (iOS VoiceOver + Android TalkBack) + keyboard-only pass on core flows

## 10.6 Acceptance Evidence Contract (Claude Build Phase)

For each build milestone, completion reports must include:

- `Status`: `intake`, `executing`, `accepted`, or `escalated`
- `Acceptance Criteria`: checklist with pass/fail per criterion
- `Evidence`: command output summary, screenshots, test logs, or query results tied to each passed criterion
- `Open Risks`: explicit unresolved risks or partial verification
- `Need Human Input`: only if blocked by approvals, secrets, or scope conflict

No milestone is marked done unless status is `accepted` with fresh evidence.

## 10.7 Required ADRs Before Feature Build

Create and accept these ADRs before implementation begins:

- ADR-001: PWA + Next.js + Supabase architecture choice and constraints
- ADR-002: Two-independent-schedule model (staff vs student) and synchronization non-goals
- ADR-003: Auth model (magic link), session duration, and account lifecycle controls
- ADR-004: Security baseline (RLS strategy, headers, audit logging, incident response)
- ADR-005: Offline/realtime strategy (cache staleness model, reconciliation behavior, failure fallback)

Each ADR must include context, options considered, decision, consequences, and rollback/supersession trigger.

## 11. Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | PWA, not native app | No App Store needed. One codebase. Ships in weeks. 200 users don't need native. |
| 2 | Two independent schedules | Staff and student agendas don't map 1:1. Concurrent sessions, setup blocks, surprise protection. |
| 3 | Magic link auth | No passwords for kids to forget. Supabase has it built in. |
| 4 | Push notifications = opt-in bonus | Not reliable enough on iOS to be critical path. In-app announcements are primary. |
| 5 | Supabase default SMTP | Start simple. Upgrade to Mailchimp/Resend SMTP only if deliverability is an issue. |
| 6 | Static campus map | Stockton PDF converted to image. Interactive map is P2. |
| 7 | 5 admin accounts | Bryan, Natalie De Rosa, Ben Jones, Caroline, Danes. |
| 8 | live.torchleadershipacademy.org | Matches "TORCH Live" product name. Squarespace DNS CNAME → Vercel. |
| 9 | Offline = cached last-known state | Spotty wifi at Stockton. Service worker + IndexedDB. |
| 10 | Year-over-year reusable | Archive old year, copy schedule template, import new users. |

---

## 12. Out of Scope

- **Two-way messaging or chat.** Broadcast only.
- **Photo/video sharing.** Nat handles social separately.
- **Attendance tracking.** Josh's surveys are separate.
- **Payment or registration.** Existing TORCH forms.
- **Staff role subtypes.** All staff see the same staff view for MVP.
- **Native iOS/Android app.** PWA.
- **AI features.** Simple, reliable, human-managed.
- **Complex notification targeting.** No per-team or per-individual targeting for MVP.

---

## 13. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) | Server components, Vercel-native |
| Styling | Tailwind CSS | Fast iteration, responsive |
| UI Components | shadcn/ui | Accessible, Tailwind-native |
| Hosting | Vercel | One-click deploy, edge CDN |
| Database | Supabase PostgreSQL | RLS, realtime, auth built-in |
| Auth | Supabase Magic Links | Zero custom auth code |
| Realtime | Supabase Realtime | WebSocket schedule push |
| Push | Web Push API | Browser-native, no app store |
| Offline | Service Worker + IndexedDB | PWA standard |
| Storage | Supabase Storage | Map image, resource files |
| DNS | Squarespace (CNAME → Vercel) | Bryan controls this |
| Version Control | GitHub | Vercel auto-deploys from main |

---

## 14. What This Is

This is not a conference app. It's not Sched or Whova. Those are built for 5,000-person conferences where attendees browse sessions and build personal agendas.

TORCH Live is a flight information display board on every student's phone. You look at it. You see where to be. You go. It updates in real time. The TORCH brand wraps the experience so it feels like part of the program, not a generic tool.

Simple. Reliable. Branded. Reusable.

---

*This document is the build spec. Every implementation decision in Claude Code traces back to a requirement here.*
